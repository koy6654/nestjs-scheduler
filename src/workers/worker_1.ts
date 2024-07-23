import { parentPort } from 'worker_threads';
import { WorkerData } from '../types/types';
import { makeParentPortMessage, sleep } from '../utils/utils';

parentPort.on('message', async (data: WorkerData) => {
	try {
		sleep(2 * 1000);

		throw new Error('d60768bb-444d-5432-86e0-b440271fc1d2')

		const parentPortMessage = makeParentPortMessage('task1', 'completed', null)
		parentPort.postMessage(parentPortMessage);
	} catch (err) {
		const parentPortMessage = makeParentPortMessage('task1', 'error', err)
		parentPort.postMessage(parentPortMessage);
	} finally {
		process.exit(0);
	}
});
