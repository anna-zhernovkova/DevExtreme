"use strict";
// TODO: Move it inside the "SeriesDataSource"
function drawSeriesView(root, seriesDataSource, translator, canvas, isAnimationEnabled) {
    var seriesList = seriesDataSource.getSeries(),
        series,
        i,
        ii = seriesList.length,
        valueAxis;

    seriesDataSource.adjustSeriesDimensions();

    if(!seriesList.length) {
        return;
    }

    valueAxis = seriesList[0].getValueAxis();
    valueAxis.setBusinessRange(seriesDataSource.getBoundRange().val);

    //TODO looks wrong
    valueAxis.updateCanvas({
        top: canvas.top,
        bottom: 0,
        height: canvas.height + canvas.top
    });

    for(i = 0; i < ii; ++i) {
        series = seriesList[i];
        series._extGroups.seriesGroup = series._extGroups.labelsGroup = root;
        series.draw(isAnimationEnabled);
    }
}

function merge(a, b) {
    return a !== undefined ? a : b;
}

function RangeView(params) {
    this._params = params;
    this._clipRect = params.renderer.clipRect();
    params.root.attr({ "clip-path": this._clipRect.id });
}

RangeView.prototype = {
    constructor: RangeView,

    update: function(backgroundOption, backgroundTheme, canvas, isCompactMode, isAnimationEnabled, seriesDataSource) {
        var renderer = this._params.renderer,
            root = this._params.root,
            canvasWidth = canvas.width - canvas.left,
            seriesGroup;

        backgroundOption = backgroundOption || {};
        root.clear();
        this._clipRect.attr({ x: canvas.left, y: canvas.top, width: canvasWidth, height: canvas.height });
        if(!isCompactMode) {
            if(merge(backgroundOption.visible, backgroundTheme.visible)) {
                if(backgroundOption.color) {
                    renderer.rect(canvas.left, canvas.top, canvasWidth + 1, canvas.height).attr({
                        // Seems that "backgroundTheme.color" is never used and so can be removed both from here and from themes
                        // TODO: Check it (special attention to WidgetsGallery) and remove the option
                        fill: merge(backgroundOption.color, backgroundTheme.color),
                        "class": "dx-range-selector-background"
                    }).append(root);
                }
                if(backgroundOption.image && backgroundOption.image.url) {
                    renderer.image(canvas.left, canvas.top, canvasWidth + 1, canvas.height,
                        backgroundOption.image.url,
                        merge(backgroundOption.image.location, backgroundTheme.image.location)).append(root);
                }
            }
            if(seriesDataSource && seriesDataSource.isShowChart()) {
                seriesGroup = renderer.g().attr({ "class": "dxrs-series-group" }).append(root);
                drawSeriesView(seriesGroup, seriesDataSource, this._params.translator, canvas, isAnimationEnabled);
            }
        }
    }
};

exports.RangeView = RangeView;
