export type Environment = Record<string,string|undefined>;
export function isEmailDryRunEnabled(env?:Environment):boolean;
export function isSafeHandoffPreviewEnabled(env?:Environment):boolean;
export function transientHandoffSendResult<T>(attempt:T,previewUrl:string,env?:Environment):{attempt:T;dryRun:true;previewUrl:string}|{attempt:T;dryRun?:never;previewUrl?:never};
export function handoffSendActionState(sendResult:{dryRun?:boolean;previewUrl?:string},success:string):{success:string;dryRun:true;previewUrl:string}|{success:string;dryRun?:never;previewUrl?:never};
