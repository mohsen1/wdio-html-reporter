import * as React from 'react';
import * as path from 'path';

import { RunnerResult, SuiteStats, TestStats, ConsoleMassage, TestError } from './interfaces';

export interface ReportProps {
    runnerResults: RunnerResult[];
    /** Base path where the report is written. It is used to make image file paths relative */
    basePath: string;
}
export class ReportRenderer extends React.Component<ReportProps> {
    private get css() {
        return `
            html, body {
                font-family: sans-serif;
            }

            main {
                margin: 1rem;
            }

            .fail {
                background: #f08080;
            }

            .fade {
                opacity: 0.5;
            }

            .mono {
                font-family: monospace;
            }

            td {
                padding: 0.25rem;
                vertical-align: top;
            }

            p {
                margin: 0;
            }

            img {
                display: block;
                max-width: 100%;
            }
        `;
    }

    public render() {
        const { runnerResults } = this.props;
        return (
            <html>
                <head>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="width=device-width" />
                    <title>HTML Report</title>
                    <style>{this.css}</style>
                </head>
                <body>
                    <main>
                        {runnerResults.map((result, i) => (
                            <ResultPresenter key={i} result={result} basePath={this.props.basePath} />
                        ))}
                    </main>
                </body>
            </html>
        );
    }
}

class ResultPresenter extends React.Component<{ result: RunnerResult; basePath: string }> {
    public render() {
        const { result } = this.props;
        const isFailing = result.runnerTestsNumber.failing > 0;
        return (
            <div className={isFailing ? 'failing-result' : ''}>
                <h1>
                    <code>{result.cid}</code>
                </h1>
                <span>{result.runnerTestsNumber.passing} Passing </span>
                <span>{result.runnerTestsNumber.pending} Pending </span>
                <span>{result.runnerTestsNumber.failing} Failing </span>
                <p>Capabilities</p>
                <div>
                    <pre>{JSON.stringify(result.capabilities, null, 4)}</pre>
                </div>
                {result.suites.map((suite, i) => (
                    <SuitePresenter key={i} suite={suite} basePath={this.props.basePath} />
                ))}
            </div>
        );
    }
}

class SuitePresenter extends React.Component<{ suite: SuiteStats; basePath: string }> {
    public render() {
        const suite = this.props.suite;
        const stateEmoji: { [key: string]: string } = {
            fail: '❌',
            pending: '⏸',
            pass: '✅',
        };
        return (
            <div>
                <h2>{suite.title}</h2>
                <table>
                    <tbody>
                        {Object.keys(suite.tests).map((k, i) => {
                            const test = suite.tests[k];
                            const consoleMessages = this.getTestConsoleOutput(test);
                            const screenshots = this.getTestScreenshots(test);
                            return (
                                <tr key={i} className={test.state}>
                                    <td>{stateEmoji[test.state]}</td>
                                    <td>
                                        <p>
                                            <b>{test.title}</b>
                                        </p>
                                        <p className="fade">{this.getTestDuration(test)}</p>
                                    </td>
                                    <td>
                                        {test.error && <TestErrorPresenter error={test.error} />}
                                        {consoleMessages && <ConsoleMessagePresenter messages={consoleMessages} />}
                                        {screenshots.map((screenshot, i) => (
                                            <img src={path.relative(this.props.basePath, screenshot)} key={i} />
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    private getTestDuration(test: TestStats) {
        return (test as any)._duration + 'ms';
    }

    /** Look for browser console output of test result */
    private getTestConsoleOutput(test: TestStats): ConsoleMassage[] | undefined {
        const consoleOutput = test.output.find(output => {
            try {
                return output.type === 'result' && output.payload.requestOptions.uri.pathname.endsWith('/log');
            } catch {
                return false;
            }
        });
        if (!consoleOutput) {
            return undefined;
        }

        return consoleOutput.payload.body.value;
    }

    private getTestScreenshots(test: TestStats): string[] {
        return test.output.filter(output => output.type === 'screenshot').map(output => output.payload.filename);
    }
}

const TestErrorPresenter: React.StatelessComponent<{ error: TestError }> = ({ error }) => (
    <div>
        <p>
            <b>{error.type}</b>
        </p>
        <p>{error.message}</p>
        <p>
            Expected <code>{error.expected}</code>
        </p>
        <p>
            Actual <code>{error.actual}</code>
        </p>
        <pre>{error.stack}</pre>
    </div>
);

export class ConsoleMessagePresenter extends React.Component<{ messages: ConsoleMassage[] }> {
    public render() {
        const levelEmoji = {
            WARNING: '⚠️',
            SEVERE: '❌',
            INFO: 'ℹ️',
        };

        if (!this.props.messages.length) {
            return null;
        }
        return (
            <>
                <p>
                    <b>Browser console output</b>
                </p>
                <table className="mono">
                    <tbody>
                        {this.props.messages.map((message, i) => (
                            <tr className={message.level} key={i}>
                                <td>{levelEmoji[message.level]}</td>
                                <td>{message.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }
}
