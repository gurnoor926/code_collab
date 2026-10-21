const normalizeOutput = (value) => {
    if(typeof value !== "string"){
        return "";
    }

    return value.replace(/\r\n/g,"\n").trim();
};

const compareOutput = (actual, expected) => {
    return normalizeOutput(actual) === normalizeOutput(expected);
};

module.exports = {
    normalizeOutput,
    compareOutput
}