declare module 'xml2js-xpath'{
    export = xpath;

    module xpath{
        function evalFirst(json: any, path: string, fetch?: boolean | string): any | string;
        function find(json: any, path: string): any[];
        function jsonText(json: string | any): string;
    }
}
