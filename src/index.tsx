import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as events from 'events';
const sanitizeFilename = require('sanitize-filename');

import {
    Screenshot,
    ConsoleEvent,
    RunnerResult,
    Entity,
    BaseReporter,
    Config,
    RunnerStart,
    SpecStats,
    SuiteStats,
    ConsoleMassage,
    RunnerEnd,
    TestPassEvent,
    TestFailEvent,
    Test,
    RunnerEndEvent,
} from './interfaces';

import { ReportRenderer } from './renderer';

export interface HTMLReporterOptions {
    readonly outFile?: string;
}

/**
 * Report test results in a single paged HTML file
 */
export default class HTMLReporter extends events.EventEmitter {
    private runnerResults: RunnerResult[] = [];
    private outFile: string;

    constructor(private baseReporter: BaseReporter, private config: Config, private options: HTMLReporterOptions = {}) {
        super();
        if (!this.options.outFile) {
            this.outFile = path.resolve(process.cwd(), 'dist/wdio-html-report.html');
        } else {
            this.outFile = this.options.outFile;
        }

        const baseReporterStats = this.baseReporter.stats;

        const screenshotPath = this.config.screenshotPath;
        const screenshotsFolder = path.isAbsolute(screenshotPath)
            ? screenshotPath
            : path.join(process.cwd(), screenshotPath);

        this.on('runner:start', (runner: RunnerStart) => {
            const cid = runner.cid;

            const currentRunnerResult: RunnerResult = {
                cid,
                capabilities: runner.capabilities,
                runnerTestsNumber: {
                    failing: 0,
                    passing: 0,
                    pending: 0,
                },
                specFileHash: runner.specHash,
                specFilePath: runner.specs,
                suites: [],
            };

            this.runnerResults.push(currentRunnerResult);
        });

        this.on('runner:end', (runner: RunnerEnd) => {
            const cid = runner.cid;
            const specHash = runner.specHash;
            const suites: SuiteStats[] = this.getAllTestSuites(baseReporterStats.runners[cid].specs[specHash]);
            this.getRunner(cid).suites = suites;
        });

        this.on('test:pass', (event: TestPassEvent) => {
            this.getRunner(event.cid).runnerTestsNumber.passing++;
        });
        this.on('test:fail', (event: TestFailEvent) => {
            this.getRunner(event.cid).runnerTestsNumber.failing++;
        });

        this.on('test:pending', (test: Test) => {
            this.getRunner(test.cid).runnerTestsNumber.pending++;
        });

        this.on('runner:end', (_event: RunnerEndEvent) => {
            this.generateHTML();
        });
    }

    private getAllTestSuites(spec: SpecStats) {
        let suites: SuiteStats[] = [];

        Object.keys(spec.suites).map(suiteName => {
            const specSuites = spec.suites[suiteName];
            if (Object.keys(specSuites.tests).length !== 0) suites.push(specSuites);
        });

        return suites;
    }

    private getRunner(cid: string) {
        const res = this.runnerResults.find(r => r.cid === cid);
        if (!res) {
            throw new Error(`Results with runner CID ${cid} not found.`);
        }

        return res;
    }

    private generateHTML() {
        const html = `<!DOCTYPE html>
            ${ReactDOMServer.renderToStaticMarkup(
                <ReportRenderer runnerResults={this.runnerResults} basePath={path.dirname(this.outFile)} />,
            )}`;
        fs.writeFileSync(this.outFile!, html);
        console.info('[INFO] wrote html report to', this.outFile);
    }
}
