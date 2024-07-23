export type WorkerData = {
	threadId: string;
	data: string;
};

export type ParentPortMessageTypes = 'completed' | 'error';

export type ParentPortMessage = {
	module: string;
	type: ParentPortMessageTypes;
	err: Error;
};
