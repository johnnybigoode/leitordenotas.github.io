export default interface BrokerageNotes {
    filename: string;
    responseComplete: boolean;
    serverError: boolean;
    noteDetails: any[];
    error: {};
    server: {};
}
