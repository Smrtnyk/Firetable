declare module "diff-arrays-of-objects" {
    function diff(arr1: {[key: string]: any}[], arr2: {[key: string]: any}[], key?: string): any;
    // noinspection JSUnusedGlobalSymbols
    // eslint-disable-next-line import/no-default-export
    export default diff;
}
