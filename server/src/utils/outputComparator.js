const normalizeOutput = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.replace(/\r\n/g, "\n").trim();
};

const parseJSON = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

const compareOutput = (actual, expected) => {
    const normalizedActual = normalizeOutput(actual);
    const normalizedExpected = normalizeOutput(expected);

    // Exact match first
    if (normalizedActual === normalizedExpected) {
        return true;
    }

    // Compare parsed JSON values
    const actualJSON = parseJSON(normalizedActual);
    const expectedJSON = parseJSON(normalizedExpected);

    if (actualJSON !== undefined && expectedJSON !== undefined) {
        return JSON.stringify(actualJSON) === JSON.stringify(expectedJSON);
    }

    return false;
};

module.exports = {
    normalizeOutput,
    compareOutput
};