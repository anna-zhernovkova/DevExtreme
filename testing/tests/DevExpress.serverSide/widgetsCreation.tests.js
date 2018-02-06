"use strict";

var widgets = {
    Accordion: require("ui/accordion"),
    ActionSheet: require("ui/action_sheet"),
    Autocomplete: require("ui/autocomplete"),
    BarGauge: require("viz/bar_gauge"),
    Box: require("ui/box"),
    Bullet: require("viz/bullet"),
    Button: require("ui/button"),
    Calendar: require("ui/calendar"),
    Chart: require("viz/chart"),
    CheckBox: require("ui/check_box"),
    CircularGauge: require("viz/circular_gauge"),
    ColorBox: require("ui/color_box"),
    ContextMenu: require("ui/context_menu"),
    DataGrid: require("ui/data_grid"),
    DateBox: require("ui/date_box"),
    DeferRendering: require("ui/defer_rendering"),
    DropDownBox: require("ui/drop_down_box"),
    FileUploader: require("ui/file_uploader"),
    FilterBuilder: require("ui/filter_builder"),
    Form: require("ui/form"),
    Funnel: require("viz/funnel"),
    Gallery: require("ui/gallery"),
    LinearGauge: require("viz/linear_gauge"),
    List: require("ui/list"),
    LoadIndicator: require("ui/load_indicator"),
    LoadPanel: require("ui/load_panel"),
    Lookup: require("ui/lookup"),
    Map: require("ui/map"),
    Menu: require("ui/menu"),
    MultiView: require("ui/multi_view"),
    NavBar: require("ui/nav_bar"),
    NumberBox: require("ui/number_box"),
    Panorama: require("ui/panorama"),
    PieChart: require("viz/pie_chart"),
    Pivot: require("ui/pivot"),
    PivotGrid: require("ui/pivot_grid"),
    PivotGridFieldChooser: require("ui/pivot_grid_field_chooser"),
    PolarChart: require("viz/polar_chart"),
    Popover: require("ui/popover"),
    Popup: require("ui/popup"),
    ProgressBar: require("ui/progress_bar"),
    RangeSelector: require("viz/range_selector"),
    RangeSlider: require("ui/range_slider"),
    RadioGroup: require("ui/radio_group"),
    Resizable: require("ui/resizable"),
    ResponsiveBox: require("ui/responsive_box"),
    Scheduler: require("ui/scheduler"),
    ScrollView: require("ui/scroll_view"),
    SelectBox: require("ui/select_box"),
    SlideOut: require("ui/slide_out"),
    SlideOutView: require("ui/slide_out_view"),
    Slider: require("ui/slider"),
    Sparkline: require("viz/sparkline"),
    Switch: require("ui/switch"),
    TabPanel: require("ui/tab_panel"),
    Tabs: require("ui/tabs"),
    TagBox: require("ui/tag_box"),
    TextArea: require("ui/text_area"),
    TextBox: require("ui/text_box"),
    TileView: require("ui/tile_view"),
    Toast: require("ui/toast"),
    Toolbar: require("ui/toolbar"),
    Tooltip: require("ui/tooltip"),
    TreeList: require("ui/tree_list"),
    TreeMap: require("viz/tree_map"),
    TreeView: require("ui/tree_view"),
    ValidationGroup: require("ui/validation_group"),
    ValidationSummary: require("ui/validation_summary"),
    Validator: require("ui/validator"),
    VectorMap: require("viz/vector_map")
};

QUnit.module("Scripts loading");

Object.keys(widgets).forEach(function(widget) {
    QUnit.test(widget, function(assert) {
        assert.ok(widgets[widget], "it's possible to import " + widget);
    });
});

var notDisposableWidgets = [
    "ActionSheet",
    "ContextMenu",
    "Gallery",
    "Lookup",
    "ProgressBar",
    "Toolbar"
];

QUnit.module("Widget creation", {
    beforeEach: function() {
        var fixture = document.getElementById("qunit-fixture");
        this.element = document.createElement("div");
        fixture.appendChild(this.element);
    },
    afterEach: function() {
        if(notDisposableWidgets.indexOf(this.instance.NAME.substr(2)) === -1) {
            this.instance.dispose();
        }
    }
});

Object.keys(widgets).forEach(function(widget) {
    var excludedWidgets = [
        "BarGauge",
        "Bullet",
        "Chart",
        "CircularGauge",
        "DataGrid",
        "Funnel",
        "LinearGauge",
        "PieChart",
        "PivotGrid",
        "PolarChart",
        "RangeSelector",
        "Sparkline",
        "TileView",
        "Toast",
        "TreeMap",
        "Validator",
        "VectorMap",
    ];

    if(excludedWidgets.indexOf(widget) > -1) return;

    QUnit.test(widget, function(assert) {
        this.instance = new widgets[widget](this.element);
        assert.ok(true, "it's possible to create " + widget);
    });
});
