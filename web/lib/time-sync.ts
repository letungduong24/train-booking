export const timeSync = {
    offset: 0,

    setServerTime(serverDateStr: string) {
        if (!serverDateStr) return;
        const serverTime = new Date(serverDateStr).getTime();
        const clientTime = Date.now();
        // Simple offset: server - client. 
        // Note: Does not account for latency (RTT/2) but "Date" header is usually generation time.
        // If we want more precision, we need request start time, but axios interceptor (response) doesn't easily give request start unless configured.
        // For booking timer (minutes), 1-2s latency is acceptable.
        this.offset = serverTime - clientTime;
    },

    now() {
        return new Date(Date.now() + this.offset);
    }
};
