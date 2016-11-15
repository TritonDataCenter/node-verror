declare interface VErrorOptions {
    cause: Error;
    name?: string;
    strict?: boolean;
    constructorOpt?: Function;
    info?: VErrorInfo;
}

type VErrorInfo = { [key: string]: any };

declare class SError extends VError { }
declare class WError extends VError { }
declare class MultiError extends VError {
    constructor(errors: Error[]);
    public errors(): Error[];
}

declare class VError extends Error {
    static VError: typeof VError;
    static SError: typeof SError;
    static MultiError: typeof MultiError;
    static WError: typeof WError;

    static cause(err: Error): Error | null;
    static info(err: Error): VErrorInfo;
    static findCauseByName(err: Error, name: string): Error | null;
    static fullStack(err: Error): string;

    public cause(): Error | undefined;
    public constructor(options: VErrorOptions, format: string, ...args: any[]);
    public constructor(cause: Error, format: string, ...args: any[]);
    public constructor(format: string, ...args: any[]);
}

export = VError;
