export const styleTrim = (
    style: string,
) => {
    return style
        .replace(/\s+|\n/g, ' ')
        .trim();
}


export const checkInputEvent = (
    event: any,
) => {
    if (!event.target || !event.target.tagName) {
        return false;
    }

    if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        return true;
    }

    return false;
}
