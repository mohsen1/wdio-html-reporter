export interface TestEvent extends Entity {
        readonly type: string;
        readonly event: string;
        readonly title: string;
        readonly parent: string;
        readonly fullTitle: string;
        readonly pending: boolean;
        readonly file: string;
        readonly cid: string;
        readonly specs: string[];
        readonly runner: { [cid: string]: { browserName: string } };
        readonly parentUid: string;
        readonly specHash: string;
    }

    export interface TestPassEvent extends TestEvent {
        readonly type: 'test:pass';
        readonly event: 'test:pass';
    }

    export interface TestFailEvent extends TestEvent {
        readonly type: 'test:fail';
        readonly event: 'test:fail';
    }
    export interface TestPendingEvent extends TestEvent {
        readonly type: 'test:pending';
        readonly event: 'test:pending';
    }
    export interface RunnerEndEvent {
        readonly event: 'runner:end';
        readonly failures: number;
        readonly cid: string;
        readonly specs: string[];
        readonly specHash: string;
    }

    export interface ConsoleMassage {
        readonly level: 'WARNING' | 'SEVERE' | 'INFO';
        readonly message: string;
        readonly source: string;
        /** Unix Epoch timestamp */
        readonly timestamp: number;
    }

    /** TestEvent plus screenshot and console data */
    export interface TestEvenWithMetaData {
        readonly screenshot: string;
        readonly consoleOutput: ConsoleMassage[];
    }

    export interface ConsoleEvent {
        readonly data: {
            readonly consoleMassages: ConsoleMassage[];
            readonly test: {
                readonly title: string;
                readonly parent: string;
                readonly fullTitle: string;
                readonly pending: boolean;
                readonly file: string;
                readonly currentTest: string;
                readonly passed: boolean;
                readonly duration: number;
            };
        };
    }

    export type RunnerStart = {
        readonly cid: string;
        readonly specs: string[];
        readonly capabilities: Capabilities;
        readonly specHash: string;
    };

    export interface Timed {
        /** JSON Date */
        readonly start: string;
        /** JSON Date */
        readonly end: string;
    }

    /** Anything that has a unique id */
    export interface Entity {
        /** Unique identifier */
        readonly uid: string;
    }

    // 'runner: end' event
    export type RunnerEnd = {
        readonly cid: string;
        readonly specHash: string;
    };

    // 'test: pass | fail | pending' event
    export type Test = {
        readonly cid: string;
    };

    // 'runner:screenshot' event
    export type Screenshot = Entity & {
        readonly filename: string;
        absolutePath?: string;
    };

    export type SpecStats = {
        readonly suites: { [key: string]: SuiteStats };
    };

    export type SuiteStats = Timed &
        Entity & {
            readonly type: 'suite';
            readonly hooks: Array<{ readonly type: 'hook'; readonly title: string } & Entity & Timed>;
            readonly tests: { [key: string]: TestStats };
            readonly title: string;
        };

    export interface Output {
        type: 'beforecommand' | 'command' | 'result' | 'aftercommand' | 'command' | 'screenshot';
        payload: any;
    }

    export interface TestError {
        actual?: string;
        expected?: string;
        message: string;
        stack: string;
        type: string;
    }

    export type TestStats = Timed &
        Entity & {
            readonly title: string;
            readonly type: 'test';
            readonly output: Output[];
            readonly state: string;
            readonly error: TestError;
            failureScreenshot: Screenshot;
            consoleMassage: ConsoleMassage[];
        };

    export type RunnerResult = {
        readonly cid: string;
        readonly capabilities: Capabilities;
        readonly specFilePath: string[];
        readonly specFileHash: string;
        readonly runnerTestsNumber: TestsNumber;
        suites: SuiteStats[];
    };

    export type TestsNumber = {
        passing: number;
        pending: number;
        failing: number;
    };

    export type Capabilities = {
        readonly browserName: string;
        readonly version?: string | number;
        readonly platform?: string;
        readonly platformName?: string;
        readonly platformVersion?: string | number;
    };

    export type Config = {
        readonly screenshotPath: string;
    };

    export type ConfigOptions = {
        readonly resultsDir: string;
        readonly resultsFile: string;
    };

    export type BaseReporter = {
        readonly stats: ReporterStats;
    };

    export type ReporterStats = {
        readonly runners: { [key: string]: RunnerStats };
    };

    export type RunnerStats = {
        readonly specs: { [key: string]: SpecStats };
    };
