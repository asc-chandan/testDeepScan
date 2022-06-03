

const isDateEqual = (dObj1, dObj2) => dObj1.getTime() === dObj2.getTime();
const isDateSmaller = (dObj1, dObj2) => dObj1 < dObj2;
const isDateGreater = (dObj1, dObj2) => dObj1 > dObj2;
const isDateInRange = (dObj, [dStrt, dEnd]) => isDateEqual(dObj, dStrt) || isDateEqual(dObj, dEnd) || (isDateGreater(dObj, dStrt) && isDateSmaller(dObj, dEnd));
const isDateInBetween = (dObj, [dObj1, dObj2]) => isDateSmaller(dObj1, dObj2) ? isDateInRange(dObj, [dObj1, dObj2]) : isDateInRange(dObj, [dObj2, dObj1]);
const giveQuarterFromMonth = (month) => Math.ceil((month + 1) / 3);

export { isDateEqual, isDateSmaller, isDateGreater, isDateInRange, isDateInBetween, giveQuarterFromMonth };