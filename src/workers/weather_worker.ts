import { parentPort } from 'worker_threads';
import { WorkerData } from '../types/types';
import { makeParentPortMessage } from '../utils/utils';
import { env } from '../common/config';
import axios from 'axios';
import https from 'https';
import dayjs from 'dayjs';

interface NaverWeatherResponse {
	naverRgnCd: string;
	regionName: string;
	className: string;
	lareaNm: string;
	mareaNm: string;
	aplYmd: string;
	aplTm: null;
	tmpr: number;
	wetrCd: string;
	wetrTxt: string;
	fcastYmdt: string;
	hdayType: string;
}

const agent = new https.Agent({
	rejectUnauthorized: false,
});

const sendSlackMessage = async (channelId: string, text: string) => {
	const message = {
		channel: channelId,
		text,
	};
	const headers = {
		Authorization: `Bearer ${env.slackBotToken}`,
		'Content-Type': 'application/json',
	};

	try {
		await axios.post(env.slackBotUrl, message, {
			headers: headers,
			httpsAgent: agent,
		});
	} catch (err) {
		console.log(err);
	}
};

parentPort.on('message', async (data: WorkerData) => {
	try {
		const nowDate = dayjs().add(1, 'days').format('YYYY-MM-DD');
		const nowDateNoHypen = nowDate.replaceAll('-', '');

		const resultArray = [`${nowDate} 날씨`];

		const weatherAmArray = await getOpenWeatherMapDatas(nowDateNoHypen, 'am');
		const weatherPmArray = await getOpenWeatherMapDatas(nowDateNoHypen, 'pm');
		for (const weatherAm of weatherAmArray) {
			const regionName = weatherAm.regionName;
			
			const weatherPm = weatherPmArray.find((weather) => weather.regionName === regionName);

			const result = `${regionName} (${weatherAm.wetrTxt}) -> (${weatherPm.wetrTxt}) ${weatherAm.tmpr}℃ / ${weatherPm.tmpr}℃`;
			resultArray.push(result);
		}

		await sendSlackMessage(env.slackBotChannelId, resultArray.join('\n'));
		
		console.log('Weather worker completed');

		const parentPortMessage = makeParentPortMessage('task1', 'completed', null);
		parentPort.postMessage(parentPortMessage);
	} catch (err) {
		console.log(err);
		const parentPortMessage = makeParentPortMessage('task1', 'error', err);
		parentPort.postMessage(parentPortMessage);
	} finally {
		process.exit(0);
	}
});

async function getOpenWeatherMapDatas(aplYmd: string, hdayType: 'am' | 'pm') {
	const requestParams = JSON.stringify({
		nationFcast: {
			aplYmd,
			hdayType,
		},
	});

	const { data: data } = await axios.get(`https://weather.naver.com/choiceApi/api`, {
		params: { choiceQuery: requestParams },
	});

	const result = Object.values(data.results.choiceResult.nationFcast) as NaverWeatherResponse[];

	return result;
}
