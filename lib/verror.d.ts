declare interface VErrorOptions {
    cause: Error;
    name?: string;
    strict?: boolean;
    constructorOpt?: Function;
    info?: VErrorInfo;
}

type VErrorInfo = { [key: string]: any };

declare class VError extends Error {
    public constructor(options: VErrorOptions, format: string, ...args: any[]);
    public constructor(cause: Error, format: string, ...args: any[]);
    public constructor(format: string, ...args: any[]);

    public cause(): Error | undefined;
    public name: string;

    public toString(): string;

    public (test: string): VError;
}

declare class SError extends VError { }
declare class WError extends VError { }
declare class MultiError extends VError {
    constructor(errors: Error[]);
    public errors(): Error[];
}

declare interface VErrorConstructors<T extends VError> {
    new (options: VErrorOptions, format: string, ...args: any[]): T;
    new (cause: Error, format: string, ...args: any[]): T;
    new (format: string, ...args: any[]): T;
    (options: VErrorOptions, format: string, ...args: any[]): T;
    (cause: Error, format: string, ...args: any[]): T;
    (format: string, ...args: any[]): T;
}

declare interface VErrorStatic extends VErrorConstructors<VError> {
    cause(err: Error): Error | null;
    info(err: Error): VErrorInfo;
    findCauseByName(err: Error, name: string): Error | null;
    fullStack(err: Error): string;

    VError: VErrorConstructors<VError>;
    SError: VErrorConstructors<SError>;
    WError: VErrorConstructors<WError>;
    MultiError: VErrorConstructors<MultiError>;
}

export = <VErrorStatic>VError;
