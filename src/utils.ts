export function normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min) * 100;
}

export function clamp(value: number, min: number, max: number) {
    return value > max ? max : value < min ? min : value;
}

export function randomString(length: number): string {
    let result: string = "";
    let possible: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++)
        result += possible.charAt(Math.floor(Math.random() * possible.length));
    return result;
}