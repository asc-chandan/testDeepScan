

const isDateEqual = (dObj1, dObj2) => (dObj1.getFullYear() === dObj2.getFullYear() && dObj1.getMonth() === dObj2.getMonth() && dObj1.getDate() === dObj2.getDate() );
const isDateSmaller = (dObj1, dObj2) => dObj1 < dObj2;
const isDateGreater = (dObj1, dObj2) => dObj1 > dObj2;
const isDateInRange = (dObj, [dStrt, dEnd]) => isDateEqual(dObj, dStrt) || isDateEqual(dObj, dEnd) || (isDateGreater(dObj, dStrt) && isDateSmaller(dObj, dEnd));
const isDateInBetween = (dObj, [dObj1, dObj2]) => isDateSmaller(dObj1, dObj2) ? isDateInRange(dObj, [dObj1, dObj2]) : isDateInRange(dObj, [dObj2, dObj1]);
const giveQuarterFromMonth = (month) => Math.ceil((month + 1) / 3);
const giveNextNthDate = (dObj, n) => new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate() + n);
const givePrevNthDate = (dObj, n) => new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate() - n);
const giveEndDateOfNextNthMonth = (dObj, n) => new Date(dObj.getFullYear(), dObj.getMonth() + n + 1, 0);
const giveEndDateOfNextNthYear = (dObj, n) => new Date(dObj.getFullYear() + n + 1, -1, 31);
const giveEndDateOfNextNthQuarter = (dObj, n) => new Date(dObj.getFullYear(), (giveQuarterFromMonth(dObj.getMonth()) + n) * 3 - 1 + 1, 0);
const giveDaysCountInRange = (dObj1, dObj2) => {
   const d1 =  new Date(dObj1.getFullYear(),dObj1.getMonth(),dObj1.getDate());
   const d2 =  new Date(dObj2.getFullYear(),dObj2.getMonth(),dObj2.getDate());
   d1.setHours(0,0,0,0);
   d2.setHours(0,0,0,0);

    //For Validating Daylight Time Saving
    if ( d1.getTimezoneOffset( ) !== d2.getTimezoneOffset( ) ) {
        if ( d1.getTimezoneOffset( ) < d2.getTimezoneOffset( ) ) {
            d2.setHours( d2.getHours( ) - 1 );
        } else if ( d1.getTimezoneOffset( ) > d2.getTimezoneOffset( ) ) {
            d2.setHours( d2.getHours( ) + 1 );
        }
    }
    
   let x =   Math.abs(d1 - d2) / (24 * 3600 * 1000) + 1;
   return x;
} 
const giveMonthsCountInRange = (dStrt, dEnd) => (11 - dStrt.getMonth() + 1) + 12 * (dEnd.getFullYear() - dStrt.getFullYear() - 1) + (dEnd.getMonth() + 1);
const giveYearsCountInRange = (dObj1, dObj2) => Math.abs(dObj1.getFullYear() - dObj2.getFullYear()) + 1;
const giveQuartersCountInRange = (dObj1, dObj2) => {
    const inBtwnYears = Math.abs(dObj1.getFullYear() - dObj2.getFullYear());
    const qrtrsInBetweenYears = inBtwnYears > 1 ? (inBtwnYears - 1) * 4 : 0;
    let qrtrsInFirstYear = 0, qrtrsInSecondYear = 0
    if (dObj1.getFullYear() === dObj2.getFullYear()) {
        qrtrsInFirstYear = Math.abs(giveQuarterFromMonth(dObj1.getMonth()) - giveQuarterFromMonth(dObj2.getMonth())) + 1;
    } else if (dObj1.getFullYear() < dObj2.getFullYear()) {
        qrtrsInFirstYear = 4 - giveQuarterFromMonth(dObj1.getMonth()) + 1;
        qrtrsInSecondYear = giveQuarterFromMonth(dObj2.getMonth());
    } else {
        // For :  dObj1.getFullYear() > dObj2.getFullYear()
        qrtrsInFirstYear = giveQuarterFromMonth(dObj2.getMonth());
        qrtrsInSecondYear = 4 - giveQuarterFromMonth(dObj1.getMonth()) + 1;
    }
    return qrtrsInBetweenYears + qrtrsInFirstYear + qrtrsInSecondYear;
}

export { isDateEqual, isDateSmaller, isDateGreater, isDateInRange, isDateInBetween, giveQuarterFromMonth, giveNextNthDate,givePrevNthDate, giveEndDateOfNextNthMonth, giveEndDateOfNextNthYear, giveEndDateOfNextNthQuarter, giveDaysCountInRange, giveMonthsCountInRange, giveYearsCountInRange, giveQuartersCountInRange };