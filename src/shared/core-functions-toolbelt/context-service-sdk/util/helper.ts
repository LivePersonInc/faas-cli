import { ErrorCodes } from './constants';
import { SDKError } from '../types/errors/sdkError';

/**
 * Small helper functions that runs the provided task in race against a setTimeout with the specified
 * deadline. Further it will cleanup the timeout in any case. Ensuring it does not clock up.
 * @param task in form of an (still pending) promise
 * @param deadlineInMs time until task should be finished
 */
export async function runTaskWithDeadline(task: Promise<unknown>, deadlineInMs: number): Promise<unknown> {
    let timerID: NodeJS.Timeout; // Required in order to allow cleanup of timeouts
    const deadline = new Promise(
        (_, reject) =>
            (timerID = setTimeout(
                reject,
                deadlineInMs,
                new SDKError(ErrorCodes.General.Timeout, `Request exceeded Deadline of ${deadlineInMs}ms`),
            )),
    );
    try {
        const result = await Promise.race([task, deadline]);
        return result;
    } finally {
        clearTimeout(timerID);
    }
}
