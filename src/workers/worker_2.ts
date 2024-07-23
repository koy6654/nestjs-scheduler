import { parentPort } from 'worker_threads';
import { WorkerData } from '../types/types';
import { makeParentPortMessage, sleep } from '../utils/utils';

parentPort.on('message', async (data: WorkerData) => {
	try {
		sleep(2 * 1000);

		const parentPortMessage = makeParentPortMessage('task2', 'completed', null)
		parentPort.postMessage(parentPortMessage);
	} catch (err) {
		const parentPortMessage = makeParentPortMessage('task2', 'error', err)
		parentPort.postMessage(parentPortMessage);
	} finally {
		process.exit(0);
	}
});
