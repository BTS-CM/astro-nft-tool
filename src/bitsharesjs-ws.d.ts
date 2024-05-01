declare module "bitsharesjs-ws" {
  export namespace Apis {
    function instance(
      node?: string,
      connect?: boolean,
      timeout?: number,
      options?: any,
      errorCallback?: (error: Error) => void
    ): any;
  }
}
