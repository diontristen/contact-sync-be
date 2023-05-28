export const sanitize = (obj: Record<string, any>) => {
    return JSON.parse(JSON.stringify(obj, (_key: string, value: any) => {
        return (value === null ? undefined : value);
    }));
}

export const capitalizeKeys = (obj: Record<string, any>) => {
    return Object.entries(obj).reduce((result, [key, value]) => {
        result[key.toUpperCase()] = value;
        return result;
    }, {});
}