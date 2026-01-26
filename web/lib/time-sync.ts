export const timeSync = {
    offset: 0,

    setServerTime(serverDateStr: string) {
        if (!serverDateStr) return;
        const serverTime = new Date(serverDateStr).getTime();
        const clientTime = Date.now();
        this.offset = serverTime - clientTime;
    },

    now() {
        return new Date(Date.now() + this.offset);
    }
};
