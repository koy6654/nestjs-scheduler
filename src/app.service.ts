import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { makeWorkerOnMessageLog, makeWorkerPath, sendSlackBot } from './utils/utils';
import { ParentPortMessage } from './types/types';

@Injectable()
export class AppService {
	private readonly logger = new Logger();

	workerPath: string;

	constructor() {
		this.workerPath = path.resolve(__dirname, './workers');
	}

	@Cron('*/10 * * * *')
	checkUsageExceeded() {
		const cpus = os.cpus();
		const totalCpuTime = cpus.reduce(
			(total, cpu) => total + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle,
			0,
		);
		const usedCpuTime = cpus.reduce((total, cpu) => total + cpu.times.user + cpu.times.nice + cpu.times.sys, 0);
		const cpuUsagePercentage = Number(((usedCpuTime / totalCpuTime) * 100).toFixed(2));

		const totalMemory = os.totalmem();
		const freeMemory = os.freemem();
		const usedMemory = totalMemory - freeMemory;
		const memoryUsagePercentage = Number(((usedMemory / totalMemory) * 100).toFixed(2));
		if (isNaN(cpuUsagePercentage) || isNaN(memoryUsagePercentage)) {
			this.logger.error('Usage percent is NaN');
		}

		if (cpuUsagePercentage >= 100) {
			this.logger.error('CPU total usage has exceeded 100%');
		} else if (memoryUsagePercentage >= 100) {
			this.logger.error('Memory total usage has exceeded 100%');
		} else {
			this.logger.log(`System resources (CPU: ${cpuUsagePercentage}% Memory: ${memoryUsagePercentage}%)`);
		}
	}

	// NOTE: Run worker parallel
	@Cron('*/5 * * * * *')
	weatherWorker() {
		const workerPath = makeWorkerPath(this.workerPath, 'weather_worker');
		this.runParallelWorkers(workerPath, 'test task 1');
	}
	// @Cron('*/5 * * * * *')
	// secondWorker() {
	// 	const workerPath = makeWorkerPath(this.workerPath, 'worker_2');
	// 	this.runParallelWorkers(workerPath, 'test task 2');
	// }

	// // NOTE: Run workers (parallel vs sync)
	// @Cron('*/10 * * * * *')
	// async parallelWorker() {
	// 	const workerPath = makeWorkerPath(this.workerPath, 'worker_2');
	// 	this.logger.debug('parallelWorker start');
	// 	this.runParallelWorkers(workerPath, 'test task 1');
	// 	this.runParallelWorkers(workerPath, 'test task 2');
	// 	this.runParallelWorkers(workerPath, 'test task 3');
	// 	this.logger.debug('parallelWorker done');
	// }
	// @Cron('*/10 * * * * *')
	// async syncWorker() {
	// 	const workerPath = makeWorkerPath(this.workerPath, 'worker_2');
	// 	this.logger.debug('syncWorker start');
	// 	await this.runWorkerSync(workerPath, 'test task 1');
	// 	await this.runWorkerSync(workerPath, 'test task 2');
	// 	await this.runWorkerSync(workerPath, 'test task 3');
	// 	this.logger.debug('syncWorker done');
	// }

	runParallelWorkers(workerPath: string, data: string) {
		const worker = new Worker(workerPath);

		worker.postMessage({ threadId: worker.threadId, data });

		worker.on('message', async (message: ParentPortMessage) => {
			const parentPortMessageType = message.type;
			const messageLog = makeWorkerOnMessageLog(message);

			switch (parentPortMessageType) {
				case 'completed':
					this.logger.log(messageLog);
					break;
				case 'error':
					// await sendSlackBot(this.logger, messageLog);
					this.logger.error(messageLog);
					break;
			}

			worker.terminate();
		});

		worker.on('error', async (error) => {
			this.logger.error(error);
			worker.terminate();
		});

		worker.on('exit', (code) => {
			if (code !== 0) {
				this.logger.error(`Worker stopped with exit code ${code}`);
			}
		});
	}

	runWorkerSync(workerPath: string, data: string) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(workerPath);
			worker.postMessage({ threadId: worker.threadId, data });

			worker.on('message', async (message: ParentPortMessage) => {
				const parentPortMessageType = message.type;
				const messageLog = makeWorkerOnMessageLog(message);

				switch (parentPortMessageType) {
					case 'completed':
						this.logger.log(messageLog);
						break;
					case 'error':
						// await sendSlackBot(this.logger, messageLog);
						this.logger.error(messageLog);
						break;
				}

				resolve(worker.terminate());
			});

			worker.on('error', async (error) => {
				this.logger.error(error);
				reject(worker.terminate());
			});

			worker.on('exit', (code) => {
				if (code !== 0) {
					reject(this.logger.error(`Worker stopped with exit code ${code}`));
				}
			});
		});
	}
}
