import axios from 'axios';
import { Logger } from '@nestjs/common';
import { env } from '../common/config';
import { ParentPortMessage, ParentPortMessageTypes } from '../types/types';

export function makeWorkerPath(baseUrl: string, filePath: string) {
	return `${baseUrl}/${filePath}`;
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeParentPortMessage(
	module: string,
	type: ParentPortMessageTypes,
	err: Error | null,
): ParentPortMessage {
	return {
		module,
		type,
		err,
	};
}

export function makeWorkerOnMessageLog(message: ParentPortMessage): string {
	let messageLog = `${message.module} ${message.type}`;

	const messageError = message.err;
	if (messageError != null) {
		messageLog += ` ${messageError}`;
	}

	return messageLog;
}

export async function sendSlackBot(logger: Logger, message: string) {
	const slackBotUrl = env.slackBotUrl;
	const slackBotChannelId = env.slackBotChannelId;
	const slackBotToken = env.slackBotToken;

	try {
		await axios.post(
			slackBotUrl,
			{
				channel: slackBotChannelId,
				text: message,
			},
			{
				headers: {
					'Content-type': 'application/json',
					Authorization: `Bearer ${slackBotToken}`,
				},
			},
		);
	} catch (err) {
		logger.error(err);
	}
}
