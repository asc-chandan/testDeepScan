import { DefaultColorsList, ColorPalettes } from '../../../components/ColorPalettes';

export const drawDynamicTextBox = (args) => {
    var textData = args.textData;
    var textNetDetails = (args.textNetData !== undefined) ? JSON.parse(JSON.stringify(args.textNetData)) : {};
    console.log(args);
    var textConfig = args.textConfig;
    if (!textConfig) return;

    function drawText() {
        let textParams = {
            textWrapper: textConfig.ref,
            data: textData,
            textsNetDetails: textNetDetails,
            textSizeClass: args.textSizeClass,
            unique_key: textConfig.id,
            screen: args.screen,
            isDashboardInEditMode: args.isDashboardInEditMode,
            viewModeType: args.viewModeType
        }
        
        drawTextBox(textParams)
    }
    drawText()
}
function getInitialTextConfig(args = null) {
    if (args) {

        let isInViewModeFitToWidth = (!args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width') && args.screen);
        let textHeadingSectionHeight = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
        let textLeftPadding = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
        let textRightPadding = 0;
        let textBottomPadding = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
        let textContentPaddingBottomOrg = 15;

        if (args.textSizeClass === 'sm-grid-width') {
            textRightPadding = 0;
            textBottomPadding = isInViewModeFitToWidth ? Math.round(28 * window.innerWidth / args.screen) : 28;
            textContentPaddingBottomOrg = 15;
        }
        if (args.textSizeClass === 'xs-grid-width') {
            textLeftPadding = 0;
            textRightPadding = 0;
            textBottomPadding = isInViewModeFitToWidth ? Math.round(15 * window.innerWidth / args.screen) : 15;
            textContentPaddingBottomOrg = 15;
        }

        let initialObj = {
            padding: 70,
            textInnerHeadingSectionHeightWithMargin: args.textSizeClass !== '' ? 0 : isInViewModeFitToWidth ? Math.round(30 * window.innerWidth / args.screen) : 30,
            textHeadingSectionHeight: textHeadingSectionHeight,
            textWidgetBottomPadding: isInViewModeFitToWidth ? Math.round(textContentPaddingBottomOrg * window.innerWidth / args.screen) : textContentPaddingBottomOrg,
            textTopPadding: 0,
            textLeftPadding: textLeftPadding,
            textBottomPadding: textBottomPadding,
            textRightPadding: textRightPadding,
        }
        return initialObj;
    }

    return false;
}

const drawTextBox = (args) => {
    const initialConfig = getInitialTextConfig(args)

    if (!initialConfig) return

    //basic configurations
    let width = args.textWrapper.current.offsetWidth;
    let innerWidth = width - (initialConfig.textLeftPadding + initialConfig.textRightPadding + initialConfig.inbetweenTextAndYAxisPadding);
    let textWrapperHeight =  document.querySelector('#text-' + args.unique_key).getBoundingClientRect().height;
    let height = textWrapperHeight - initialConfig.textWidgetBottomPadding - initialConfig.textHeadingSectionHeight;
    if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
        height = height + initialConfig.textInnerHeadingSectionHeightWithMargin + (initialConfig.textWidgetBottomPadding - 5);
    }
    let innerHeight = (height - initialConfig.textBottomPadding - initialConfig.textTopPadding);
   
    console.log(innerWidth , innerHeight)

}