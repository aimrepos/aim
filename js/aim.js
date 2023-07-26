var grid;
var total;
var filters;
var columns;
var separator;
var multiselection;
var allowSearch = false;
var siteFiltersUsedOnSearch; //excel hack
var selectedgeosofexcel;
var selectedgeosofexcelExcl;

localStorage["kendo-grid-options"] = "";
var UrlBundleColumns = ['Action', 'Bundle ID', 'SF #', 'SDRD Status', 'TUG Publish Date', 'TUG Remove Date', 'TUG Start', 'TUG End'];

$(document).ready(function () {
    checkSearchAndSetPage();
    $('#addtExcel,#addtSmartExcel').click(function (e) {
        Start();
        $('#excelForm').remove();
        /*var requestObject = (new kendo.data.transports['aspnetmvc-server']({ prefix: '' }))
            .options.parameterMap({
                sort: grid.dataSource.sort(),
                filter: grid.dataSource.filter()
            });
        var sort = '&sort=' + requestObject.sort;
        var filter = '&filter=' + requestObject.filter;
        var request = filter + sort;*/
        if (table && table.getData().length > 10000) {
            if (e.target.id === "addtSmartExcel")
                search.isSmartExport = true;
            $('#emailExportModal').modal('show');
            Stop();
            return false;
        }
        var excelForm = document.createElement('form');
        var action = window.location.protocol + '//' + window.location.host + ''
            + '/' + window.location.pathname.split('/')[1];

        excelForm.id = 'excelForm';
        excelForm.method = 'post';
        excelForm.action = action.replace('ADDitudeBundleDetails', 'ADDitude') + '/ExportBundle?';

        var isSmartExport = e.target.id;
        var inputs = buildInputsFromSearch(isSmartExport);
        for (var i = 0; i < inputs.length; i++) {
            excelForm.appendChild(inputs[i]);
        }

        document.body.appendChild(excelForm);
        excelForm.submit();
        return false;
    });
    setDefaultGridOptions();
    $('#showhide-' + getSearchType()).on('shown.bs.modal', function (e) {

        if (getSearchType().includes('CreateUrlBundle')) {
            //do nothing, the logic for showhide columns for CreateUrlBundle is in the page's partial views
        }
        else {
            var ul = document.getElementById('showcolumnsul-' + getSearchType());
            ul.innerHTML = null;
            let table = Tabulator.prototype.findTable("#" + getSearchType().toLowerCase() + "-table")[0];            
            let columns = table.columnManager.columns;
            if (getSearchType().toLowerCase() == 'editoriallookup') {
                columns = columns.filter(item => item.field == "name" || item.field == "lookupName");
            }
            for (var i = 0; i < columns.length; i++) {
                var li = document.createElement('li');
                var checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                checkbox.id = columns[i].field;
                checkbox.checked = columns[i].visible;
                checkbox.name = columns[i].definition.title;
                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(columns[i].definition.title));
                ul.appendChild(li);
            }
        }
    });

    $("#apply-changes-form-" + getSearchType()).submit(async function (e) {
        e.preventDefault();
        var table = table = Tabulator.prototype.findTable("#" + getSearchType().toLowerCase() + "-table")[0];   
        var lis = document.getElementById("showcolumnsul-" + getSearchType()).getElementsByTagName("li");
        for (var i = 0; i < lis.length; i++) {
            if (lis[i].querySelector('input[type=checkbox]').checked)
                table.showColumn(lis[i].querySelector('input[type=checkbox]').id);
            else
                table.hideColumn(lis[i].querySelector('input[type=checkbox]').id);
        }
        table.redraw(true);
        $("#showhide-" + getSearchType()).modal('hide');

    });
    $('#save').click(function () {
        saveGridSettings("save");
    });

    $('#reset').click(function () {
        var table = Tabulator.prototype.findTable("#" + getSearchType().toLowerCase() + "-table")[0]
        updateGridOptions(table, GetTabulatorDefaultColumns(getSearchType()));
        table.redraw(true);
        alert('Default layout restored successfully.');
    });

    $('#AdvancedSearchModal').on('hidden.bs.modal', function (e) {
        $('#advancedSearchContent').empty();
    });
    $('#SavedSearchModal').on('hidden.bs.modal', function (e) {
        $('#savedSearchContent').empty();
        document.getElementById("SavedSearch-footer").style.display = "none";
    });
});

function openAdvancedSearch(column) {
    document.getElementById("advancedSearchContent").style.display = "none";
    document.getElementById("spinner-create").style.display = "block";
    var tempData = JSON.stringify({
        'columns': column,
        'search': JSON.parse(JSON.stringify(getUpdatedKeywordSearch()), dateUnreviver),
        'dictionary': getDictionary()
    })
    tempData = "{\"JSON\": \"" + encodeURIComponent(tempData) + "\"}";

    $.ajax({
        type: 'post',
        url: '/AdvancedSearch/Index',
        dataType: 'html',
        data: tempData,
        contentType: 'application/json',
        success: function (result) {
            $('#advancedSearchContent').html(result);
            document.getElementById("advancedSearchContent").style.display = "block";
            document.getElementById("spinner-create").style.display = "none";
            document.getElementById('tab1').disabled = true;
        },
        error: function (error) {
            document.getElementById("advancedSearchContent").style.display = "block";
            document.getElementById("spinner-create").style.display = "none";
        }
    });

}

function openSavedSearch() {
    document.getElementById("savedSearchContent").style.display = "none";
    document.getElementById("spinner-savedsearch").style.display = "block";
    var data = JSON.stringify(JSON.parse(JSON.stringify(getUpdatedKeywordSearch()), dateUnreviver));
    $.ajax({
        type: 'post',
        url: '/SavedSearch/Index',
        dataType: 'html',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (result) {
            $('#savedSearchContent').html(result);
            document.getElementById("savedSearchContent").style.display = "block";
            document.getElementById("spinner-savedsearch").style.display = "none";
            document.getElementById("SavedSearch-footer").style.display = "block";
        }
    });
}

function IsValidEmail() {
    if ($('#chkReport').is(":checked")) {
        var emailIds = $('#txtEmailIds').val().split(',');
        var mailformat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var isValidEmails = true;
        for (var i = 0; i < emailIds.length; i++) {
            isValidEmails = mailformat.test(emailIds[i]);
            if (!isValidEmails)
                break;
        }
        return isValidEmails;
    }
    else
        return true;
}

function getSearchType() {
    var searchType = "";
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.indexOf('productreservation') > 0)
        searchType = "ProductReservation";
    else if (pathname.indexOf('product') > 0)
        searchType = "Product";
    else if (pathname.indexOf('reservation') > 0)
        searchType = "Reservation";
    else if (pathname.indexOf('urlbundle') > 0) {
        if (pathname.indexOf('urlbundle/urlbundle') > 0 || pathname.indexOf('urlbundle/bundledetails') > 0 )
            searchType = "CreateUrlBundle";
        else searchType = "URLBundle";
    }
    else if (pathname.indexOf('urlsearch') > 0)
        searchType = "Url";
    else if (pathname.indexOf('brandseeker') > 0)
        searchType = "BrandSeeker";
    else if (pathname.indexOf('editorial') > 0) {
        if (pathname.indexOf('editorial/editoriallookup') > 0)
            searchType = "EditorialLookup";
        else searchType = "EditorialTracker";
    }
    else if (pathname.indexOf('additude') > 0)
        searchType = "ADDitude";
    else if (pathname.indexOf('patientselect') > 0)
        searchType = "PatientSelect";

    return searchType;
}

function updateGridOptions(table, columns) {
    if (columns != null) {
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].visible == null || columns[i].visible == true)
                table.showColumn(columns[i].field);
            else
                table.hideColumn(columns[i].field);
        }
    }
    else if (localStorage["kendo-grid-options"]) {
        var tablecolumns = JSON.parse(localStorage["kendo-grid-options"]);
        for (var i = 0; i < tablecolumns.columns.length; i++) {
            if (tablecolumns.columns[i].Visible)
                table.showColumn(tablecolumns.columns[i].Name);
            else
                table.hideColumn(tablecolumns.columns[i].Name);
        }
    }
}
function saveGridSettings(actionType) {
    var table = Tabulator.prototype.findTable("#" + getSearchType().toLowerCase() + "-table")[0];
    var tablecolumns = table.columnManager.columns;
    var columns = [];
    if (actionType === "save") {
        for (let cols of tablecolumns) {
            var coltype = 0;
            if (cols.definition.sorter == "string") {
                coltype = 0;
            }
            else if (cols.definition.sorter == "date") {
                coltype = 1;
            }
            else if (cols.definition.sorter == "number") {
                coltype = 2;
            }
            else if (cols.definition.sorter == "boolean") {
                coltype = 3;
            }
            else if (cols.definition.sorter == "long") {
                coltype = 4;
            }
            var column = {
                'Name': cols.field,
                'Title': cols.definition.title,
                'Type': coltype,
                'Visible': cols.visible
            };
            columns.push(column);
        }

    }
    else {
        columns = "";
    }

    var data = JSON.stringify({
        'SearchType': getSearchType(),
        'Value': JSON.stringify({
            columns: columns
        }),

    });
    $.ajax({
        type: 'post',
        url: '/SavedSearch/SaveGridOptions',
        dataType: 'html',
        data: data,
        cache: false,
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            localStorage["kendo-grid-options"] = JSON.stringify({
                columns
            });
            if (actionType === "save") {
                alert("Layout saved successfully.");
            }
            else {
                updateGridOptions(table);
                alert("Default layout restored successfully.");

            }
        }
    });





}

function setDefaultGridOptions() {
    var searchType = getSearchType();

        $.ajax({
            type: 'get',
            url: '/SavedSearch/GetDefaultGridOptions/?searchType=' + searchType,
            dataType: 'html',
            cache: false,
            async: false,
            contentType: 'application/json; charset=utf-8',
            success: function (result) {
                localStorage["kendo-grid-options"] = result;
            }
        });
}


function checkSearchAndSetPage() {
    if (typeof search === 'undefined') {
        return;
    }
    if (search.Id === undefined) {
        //grid.dataSource.read(JSON.parse(JSON.stringify(search), dateUnreviver));
        return;
    }

    //if (search.AdvancedSearch.Filters == null ||
    //    search.AdvancedSearch.Filters.length < 1 &&
    //    search.AdvancedSearch.ReservationStartDate == null &&
    //    search.AdvancedSearch.ReservationEndDate == null) {
    if (search.IsKeywordSearch) {
        $('#keywordSearchMgmt').show();
    }
    else {
        $('#openAdvancedSearchModal').text('Edit Advanced Search Settings')
            .css('font-style', 'italic');
        $('#openAdvancedSearchModal').parent().css('padding-bottom', '10px');
        $('#keywordSearchMgmt').hide();
    }
    $('#advancedSearchMgmt').show();

    if (search.Id > 0 || search.Id == -1) {
        $('#results').show();
        if ($('#results').is(":hidden")) {

            let element = document.getElementById("results");

            element.removeAttribute("hidden");

            var maxHeight = -1;
            $('#grid').find('.k-grid-header .k-header').each(function () {
                $(this).wrapInner('<div class="relative"/>');

                var height = $(this).find('.k-link').height();
                if (height > maxHeight) {
                    maxHeight = height;
                }
            });
            $('div.relative').each(function () {
                $(this).height(maxHeight);
            });
        }
        $('#import').hide(); //hide URL Import icon
        $('#lblResults').html('<b>Showing Results for ' + search.Name + '</b>');

        siteFiltersUsedOnSearch = $.extend([], search.KeywordSearch.Runtimes); //shallow copy for excel export
        selectedgeosofexcel = $.extend([], search.GeoTargets); //shallow copy for excel export
        selectedgeosofexcelExcl = $.extend([], search.GeoTargetsExcl); //shallow copy for excel export
       /* grid.dataSource.options.serverFiltering = false;  //unnecessary if all grids have .ServerOperation(false); set now
        grid.dataSource.options.serverPaging = false; //unnecessary if all grids have .ServerOperation(false); set now
        grid.dataSource.options.serverSorting = false; //unnecessary if all grids have .ServerOperation(false); set now
        //grid.dataSource._filter = JSON.parse(JSON.stringify(filters), dateReviver);
        //grid.dataSource._sort = {};
        grid.dataSource.read(JSON.parse(JSON.stringify(search), dateUnreviver));*/
        //if (search.SearchType == 2)
        //    table.setData("/UrlSearch/GetSearchResults", search, "post");
        //else if (search.SearchType == 5)
        //    table.setData("/UrlBundle/GetSearchResults", search, "post");
        //else if (search.SearchType == 1)
        //    table.setData("/Product/GetSearchResults", search, "post");
        //else if (search.SearchType == 10)
        //    table.setData("/ADDitude/GetSearchResults", search, "post");

        if (search.IsKeywordSearch) {
            if (search.KeywordSearch != null && search.KeywordSearch.ReservationStartDate != null) {
                var startDate = new Date(search.KeywordSearch.ReservationStartDate);
               // $('#KeywordSearch_ReservationStartDate').val(startDate.toLocaleDateString());
            }
            if (search.KeywordSearch != null && search.KeywordSearch.ReservationStartDate != null) {
                var endDate = new Date(search.KeywordSearch.ReservationEndDate);
                //$('#KeywordSearch_ReservationEndDate').val(endDate.toLocaleDateString());
            }
            $('#btnKeywordSearch').trigger('click');
        }
        else {
            if (search.SearchType == 2)
                table.setData("/UrlSearch/GetSearchResults", search, "post");
            else if (search.SearchType == 5)
                table.setData("/UrlBundle/GetSearchResults", search, "post");
            else if (search.SearchType == 1)
                table.setData("/Product/GetSearchResults", search, "post");
            else if (search.SearchType == 10)
                table.setData("/ADDitude/GetSearchResults", search, "post");
            else if (search.SearchType == 6)
                table.setData("/Editorial/GetSearchResults", search, "post");
            else if (search.SearchType == 3)
                table.setData("/Reservation/GetSearchResults", search, "post");
            table.redraw(true);
        }
    }
}

function getDictionary() {
    var dictionary = null;
    //alert('multiselection: ' + multiselection);
    if (multiselection != null) {
        var i = 0;
        dictionary = [];
        for (var key in multiselection) {
            if (multiselection.hasOwnProperty(key)) {
                dictionary.push({ [key] : multiselection[key] });
            }

            i++;
        }
    }

    return dictionary;
}

function getColumns() {
    var columns = [];
    if ($('#grid').data('kendoGrid') === undefined)
        return columns;
    var cols = $('#grid').data('kendoGrid').columns;
    var fields = grid.dataSource.options.schema.model.fields;

    for (var i = 0; i < cols.length; i++) {
        if (cols[i].field in fields) {
            var column = {
                'name': cols[i].field,
                'title': cols[i].title.replace('&#8203;', ''),
                'type': fields[cols[i].field].type
            };

            if (column.name !== grid.dataSource.options.schema.model.id && column.name !== 'Indication') {
                columns.push(column);
            }
        }
    }
    if (getSearchType() === 'URLBundle')
        for (i = columns.length - 1; i >= 0; --i) {
            const index = UrlBundleColumns.indexOf(columns[i].title);
            if (index !== -1) {
                columns.splice(i, 1);
            }
        }

    return columns;
}

function getSearch() {
    return JSON.parse(JSON.stringify(search), dateUnreviver);
}

function getUpdatedKeywordSearch() {
    var temp = search;
    temp.KeywordSearch.Keywords = $('#KeywordSearch_Keywords').val();
    temp.KeywordSearch.Operator = $('#KeywordSearch_Operator').val();
    temp.KeywordSearch.ReservationStartDate = $('#KeywordSearch_ReservationStartDate').val();
    temp.KeywordSearch.ReservationEndDate = $('#KeywordSearch_ReservationEndDate').val();
    temp.KeywordSearch.Runtimes = $('#siteFilter').val();
    temp.KeywordSearch.Bundles = $('#bundleFilter').val();
    temp.KeywordSearch.Status = $('#statusFilter').val();
    temp.KeywordSearch.Stream = $('#streamFilter').val();
    temp.KeywordSearch.AssetType = $('#assetTypeFilter').val();
    temp.KeywordSearch.Action = $('#versionFilter').val();
    temp.KeywordSearch.Editor = $('#editorFilter').val();

    return temp;
}


function updateSearch() {
    var data = {};
    data.KeywordSearch = {};
    data.AdvancedSearch = {};
    //var advSearchOperator = $("#advOperator").data("kendoDropDownList").value();
    data.Id = search.Id != null ? search.Id : null;
    data.Name = search.Name != null ? search.Name : null;
    data.SearchType = search.SearchType != null ? search.SearchType : null;
    data.IsKeywordSearch = search.IsKeywordSearch != null ? search.IsKeywordSearch : null;
    data.KeywordSearch.Runtimes = $('#siteFilter').val() != null ? $('#siteFilter').val() : null;
    data.KeywordSearch.Keywords = $('#KeywordSearch_Keywords').val();
    data.KeywordSearch.Operator = $('#KeywordSearch_Operator').val();
    data.KeywordSearch.ReservationStartDate = $('#KeywordSearch_ReservationStartDate').val();
    data.KeywordSearch.ReservationEndDate = $('#KeywordSearch_ReservationEndDate').val();
    data.KeywordSearch.Bundles = $('#bundleFilter').val() != null ? $('#bundleFilter').val() : null;
    data.AdvancedSearch.Operator = $('#AdvancedSearch_Operator').val();
    data.AdvancedSearch.ReservationStartDate = $('#AdvancedSearch_ReservationStartDate').val();
    data.AdvancedSearch.ReservationEndDate = $('#AdvancedSearch_ReservationEndDate').val();
    data.AdvancedSearch.Filters = getFilters();
    data.AdvancedSearch.Sorts = getSorts();
    data.KeywordSearch.IsIncludeExpired = $('#IncludeExpired').is(':checked');
  //  data.KeywordSearch.TUGStartDate = $('#KeywordSearch_TUGStartDate').val();
   // data.KeywordSearch.TUGEndDate = $('#KeywordSearch_TUGEndDate').val();
    data.GeoTargets = $('#GeoTargets').val() != null ? $('#GeoTargets').val()  : null;
    data.KeywordSearch.GeoTargetsExcl = $('#GeoTargetsExcl').val() != null ? $('#GeoTargetsExcl').val()  : null;
    ($('#statusFilter').val() != null) ? data.KeywordSearch.Status = $('#statusFilter').val() : null;
    ($('#editorFilter').val() != null) ? data.KeywordSearch.Editor = $('#editorFilter').val() : null;
    ($('#assetTypeFilter').val() != null) ? data.KeywordSearch.AssetType = $('#assetTypeFilter').val() : null;
    ($('#versionFilter').val() != null) ? data.KeywordSearch.Action = $('#versionFilter').val() : null;
    ($('#streamFilter').val() != null) ? data.KeywordSearch.Stream = $('#streamFilter').val() : null;
    ($('#bundleTypeFilter').val() != null) ? data.KeywordSearch.BundleTypes = $('#bundleTypeFilter').val() : null;
    ($('#bundleStatusFilter').val() != null) ? data.KeywordSearch.BundleStatus = $('#bundleStatusFilter').val() : null;
    return data;
}
function onHyper(geoDetails, geoTargetsad) {

    //console.log(geoDetails);
    geoDetails.geoType = 'Inclusions';
    $.ajax({
        type: 'POST',
        url: '/AdvancedSearch/GetUrlHyperTargets',
        dataType: "json",
        data: JSON.stringify(
            geoDetails
        ),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {


            $("#GeoTargetsadv").empty();


            data.forEach(element => {
                let num = element.geoId;
                let text = num.toString();
                if ($.inArray(text, geoTargetsad) >= 0) {
                    $("#GeoTargetsadv").append(`<option  selected="selected" value="${element.geoId}" >${element.geoName}</option>`)
                } else {
                    $("#GeoTargetsadv").append(`<option value="${element.geoId}" >${element.geoName}</option>`)
                }
            });



        },

    });





}
function onHyperEx(geoDetails, geoTargetsExcladv) {

    geoDetails.geoType = 'Exclusions';
    $.ajax({
        type: 'POST',
        url: '/AdvancedSearch/GetUrlHyperTargets',
        dataType: "json",
        data: JSON.stringify(
            geoDetails
        ),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            $("#GeoTargetsExcladv").empty();
            data.forEach(element => {
                let num = element.geoId;
                let text = num.toString();
                if ($.inArray(text, geoTargetsExcladv) >= 0) {
                    $("#GeoTargetsExcladv").append(`<option  selected="selected" value="${element.geoId}" >${element.geoName}</option>`)
                } else {
                    $("#GeoTargetsExcladv").append(`<option value="${element.geoId}" >${element.geoName}</option>`)
                }
            });
        },
    });
}

function getIsMultiSelectableColumn(column) {
    /*console.log('getIsMultiSelectableColumn for argument: ', column);
    console.log('Object.getOwnPropertyNames(multiselection): ', Object.getOwnPropertyNames(multiselection));
    console.log('column argument in getIsMultiSelectableColumn(column): ', column);
    console.log('multiselection != null: ', multiselection != null);
    console.log('getIsMultiSelectableColumn(column): ', multiselection != null && Object.getOwnPropertyNames(multiselection).map(name => name.toLocaleLowerCase()).includes(column.toLocaleLowerCase()));*/
    return multiselection != null && multiselection.hasOwnProperty(column);
}

function getFilters() {
    var filters = [];
    $('#filters tr').each(function () {
        var value;
        var toDate;
        var name = $(this).find('td:eq(1)').find('.ddlFilterColumn').val();
        var title = $(this).find('td:eq(1)').find('.hiddenFilterColumnTitle').val();
        var conditional = $(this).find('td:eq(2)').find('.ddlFilterConditional').val();
        var isMultiSelectableColumn = getIsMultiSelectableColumn(name);

        var column = new Object();
        column.Name = name;
        column.Title = title;
        column.Type = getColumnType(name);

        //if column contains kendo multiselect control
        var multiSelect = $(this).find('td:eq(3)').find('.select2').find('.select2-selection__choice__display');
        var datepicker = $(this).find('td:eq(3)').find('input.dateFilterValue');
        var datepickerTo = $(this).find('td:eq(3)').find('input.dateFilterToValue');
        if (multiSelect.length > 0) {
            var values = []

            for (var i = 0; i < multiSelect.length; i++) {
                //if (multiSelect[i].hasOwnProperty('text')) {
                //    values.push(multiSelect[i].value);
                //}
                //else {
                values.push(multiSelect[i].textContent);
                //}
            }


            value = values.join(separator);
        }
        else if (column.Type == 'Date' && datepicker.val() != undefined) {
            value = datepicker.val();
            if (conditional == 'DateRange' && datepickerTo.val() != undefined) {
                toDate = datepickerTo.val();
            }
        }
        else {
            value = $(this).find('td:eq(3)').find('.txtFilterValue').val();
        }

        var filter = new Object();
        filter.Column = column;
        filter.Operator = conditional;
        filter.Value = value;
        filter.ToDate = toDate;
        filter.MultiSelect = isMultiSelectableColumn;
        filters.push(filter);
    });

    return filters;
}

function getSorts() {
    var sorts = [];
    $('#sorts li').each(function () {
        var sort = new Object();
        var column = $(this).find('.hiddenSortColumn').val();
        var direction = $(this).find('.hiddenSortColumn').next().val();

        sort.Column = column;
        sort.Direction = direction;
        sorts.push(sort);
    });

    return sorts;
}

function onError(e) {
    window.location.href = '/Errors/Index';
}

function requestStart(e) {
    var a = e;
}

function requestEnd(e) {
    if (e.response != null) {
        if (e.response.Error != null) {
            if (e.response.Error == outOfMemoryErrorCode) { //global outOfMemoryErrorCode variable set on Index.cshtml (C# ViewBag prop.)
                $('#lblNoResults').html('<i><b style="font-size:14px;color:red">Results contain too many records, please limit search criteria.</b></i>');
            } else if (e.response.Error == fileErrorCode) { //global fileErrorCode variable set on Index.cshtml (C# ViewBag prop.)
                $('#lblNoResults').html('<i><b style="font-size:14px;color:red">' + e.response.Msg + '</b></i>');
            } else {
                if (e.response.Partial) {
                    window.location.href = '/Errors/Partial';
                }
                else {
                    window.location.href = '/Errors/Index';
                }
            }
        } else if (e.response.GrandTotal > max) {               //no need to switch to server side now that we limit the amount of results in URL grid results
            showReservationOptions(search.SearchType);          //previous kendo controls did not handle > 200k records very well, we'll have to turn off this method and test 
            grid.dataSource.options.serverFiltering = true;     //unnecessary if all grids have .ServerOperation(false); set now and testing above shows we can leave it false
            grid.dataSource.options.serverPaging = true;        //unnecessary if all grids have .ServerOperation(false); set now and testing above shows we can leave it false
            grid.dataSource.options.serverSorting = true;       //unnecessary if all grids have .ServerOperation(false); set now and testing above shows we can leave it false
            $('#lblNoResults').html(e.response.GrandTotal + ' results returned');
        } else if (e.response.GrandTotal > 0) {
            showReservationOptions(search.SearchType);
            var label = e.response.GrandTotal + ' results returned';

            if (e.response.hasOwnProperty('Bulk') && e.response.Bulk != null && e.response.Bulk != '') {
                label += '<br/ >No Results Found for Rows ' + e.response.Bulk;
            }

            $('#lblNoResults').html(label);
        } else if (e.response.GrandTotal < 1) {
            hideReservationOptions(search.SearchType);
            $('#lblNoResults').html('<i><b style="font-size:14px;color:red">' +
                'No Results Found, Please Enter New Search Criteria.</b></i>');
        }

        total = e.response.GrandTotal != null ? e.response.GrandTotal : 0; //total: global variable for overridding default grid filter(s)

    }
}

function hideReservationOptions(searchType) {
    if (searchType == 4) {
        $('#lblReserveTip').empty();
        $('#lblReserveTip').hide();
        $('#btnReserveProduct').hide();
        $('#lblHelp').hide();
    }
}

function showReservationOptions(searchType) {
    if (searchType == 4) {
        $('#lblReserveTip').html(
            'Select desired record below for your SDRD and then click on the Reserve Product button (limit one per SDRD).');
        $('#lblReserveTip').show();
        $('#btnReserveProduct').show();
        $('#lblHelp').show();
    }
}

function buildInputsFromSearch(exportType) {
    var inputs = [];
    if (search.SearchType == 5 || search.SearchType == 9 || search.SearchType == 10) {
        if (document.querySelector('#BundleID') != null & document.querySelector('#Name') != null) {
            search.Id = document.querySelector('#BundleID').value;
            search.Name = document.querySelector('#Name').value;
        }
    }
    inputs.push(getInput('Id', search.Id));
    inputs.push(getInput('Name', search.Name));
    inputs.push(getInput('File', search.File));
    inputs.push(getInput('SearchType', search.SearchType));
    inputs.push(getInput('IsKeywordSearch', search.IsKeywordSearch));
    inputs.push(getInput('KeywordSearch.Keywords', search.KeywordSearch.Keywords));
    inputs.push(getInput('KeywordSearch.Operator', search.KeywordSearch.Operator));
    inputs.push(getInput('KeywordSearch.ReservationStartDate',
        dateParser(search.KeywordSearch.ReservationStartDate)));
    inputs.push(getInput('KeywordSearch.ReservationEndDate',
        dateParser(search.KeywordSearch.ReservationEndDate)));
    inputs.push(getInput('KeywordSearch.IsIncludeExpired', search.KeywordSearch.IsIncludeExpired));
    inputs.push(getInput('KeywordSearch.TUGStartDate',
        dateParser(search.KeywordSearch.TUGStartDate)));
    inputs.push(getInput('KeywordSearch.TUGEndDate',
        dateParser(search.KeywordSearch.TUGEndDate)));
    if (search.SearchType == 6) {
        if (search.KeywordSearch.Editor != null && search.KeywordSearch.Editor.length > 0)
            for (var i = 0; i < search.KeywordSearch.Editor.length; i++) {
                inputs.push(getInput('KeywordSearch.Editor[' + i + ']', search.KeywordSearch.Editor[i]));
            }
        if (search.KeywordSearch.Status != null && search.KeywordSearch.Status.length > 0)
            for (var i = 0; i < search.KeywordSearch.Status.length; i++) {
                inputs.push(getInput('KeywordSearch.Status[' + i + ']', search.KeywordSearch.Status[i]));
            }
        if (search.KeywordSearch.Stream != null && search.KeywordSearch.Stream.length > 0)
            for (var i = 0; i < search.KeywordSearch.Stream.length; i++) {
                inputs.push(getInput('KeywordSearch.Stream[' + i + ']', search.KeywordSearch.Stream[i]));
            }
        if (search.KeywordSearch.Action != null && search.KeywordSearch.Action.length > 0)
            for (var i = 0; i < search.KeywordSearch.Action.length; i++) {
                inputs.push(getInput('KeywordSearch.Action[' + i + ']', search.KeywordSearch.Action[i]));
            }
        if (search.KeywordSearch.AssetType != null && search.KeywordSearch.AssetType.length > 0)
            for (var i = 0; i < search.KeywordSearch.AssetType.length; i++) {
                inputs.push(getInput('KeywordSearch.AssetType[' + i + ']', search.KeywordSearch.AssetType[i]));
            }
    }
    if (search.KeywordSearch.Bundles != null && search.KeywordSearch.Bundles.length > 0) {
        for (var k = 0; k < search.KeywordSearch.Bundles.length; k++) {
            inputs.push(getInput('KeywordSearch.Bundles[' + k + ']', search.KeywordSearch.Bundles[k]));
        }
    }
    if (siteFiltersUsedOnSearch != null && siteFiltersUsedOnSearch.length > 0) {
        for (var k = 0; k < siteFiltersUsedOnSearch.length; k++) {
            inputs.push(getInput('KeywordSearch.Runtimes[' + k + ']', siteFiltersUsedOnSearch[k]));
        }
    }
    if (search.KeywordSearch.BundleStatus != null && search.KeywordSearch.BundleStatus.length > 0) {
        for (var k = 0; k < search.KeywordSearch.BundleStatus.length; k++) {
            inputs.push(getInput('KeywordSearch.BundleStatus[' + k + ']', search.KeywordSearch.BundleStatus[k]));
        }
    }
    if (search.KeywordSearch.BundleTypes != null && search.KeywordSearch.BundleTypes.length > 0) {
        for (var k = 0; k < search.KeywordSearch.BundleTypes.length; k++) {
            inputs.push(getInput('KeywordSearch.BundleTypes[' + k + ']', search.KeywordSearch.BundleTypes[k]));
        }
    }
    if (selectedgeosofexcel != null && selectedgeosofexcel.length > 0) {
        for (var g = 0; g < selectedgeosofexcel.length; g++) {
            inputs.push(getInput('GeoTargets[' + g + ']', selectedgeosofexcel[g]));
        }
    }
    if (selectedgeosofexcelExcl != null && selectedgeosofexcelExcl.length > 0) {
        for (var h = 0; h < selectedgeosofexcelExcl.length; h++) {
            inputs.push(getInput('KeywordSearch.GeoTargetsExcl[' + h + ']', selectedgeosofexcelExcl[h]));
        }
    }

    if (search.AdvancedSearch != null
        && search.AdvancedSearch.Filters != null && search.AdvancedSearch.Filters.length > 0) {
        inputs.push(getInput('AdvancedSearch.Operator', search.AdvancedSearch.Operator));
        inputs.push(getInput('AdvancedSearch.ReservationStartDate', dateParser(search.AdvancedSearch.ReservationStartDate)));
        inputs.push(getInput('AdvancedSearch.ReservationEndDate', dateParser(search.AdvancedSearch.ReservationEndDate)));

        for (var i = 0; i < search.AdvancedSearch.Filters.length; i++) {
            var isMultiSelectableColumn = getIsMultiSelectableColumn(search.AdvancedSearch.Filters[i].Column.Name);
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].MultiSelect', isMultiSelectableColumn));
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].Column.Name',
                search.AdvancedSearch.Filters[i].Column.Name));
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].Column.Title',
                search.AdvancedSearch.Filters[i].Column.Title));
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].Column.Type',
                search.AdvancedSearch.Filters[i].Column.Type));
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].Value',
                search.AdvancedSearch.Filters[i].Value));
            inputs.push(getInput('AdvancedSearch.Filters[' + i + '].Operator',
                search.AdvancedSearch.Filters[i].Operator));
        }
    }

    if (search.AdvancedSearch != null
        && search.AdvancedSearch.Sorts != null && search.AdvancedSearch.Sorts.length > 0) {
        for (var j = 0; j < search.AdvancedSearch.Sorts.length; j++) {
            inputs.push(getInput('AdvancedSearch.Sorts[' + j + '].Column',
                search.AdvancedSearch.Sorts[j].Column));
            inputs.push(getInput('AdvancedSearch.Sorts[' + j + '].Direction',
                search.AdvancedSearch.Sorts[j].Direction));
        }
    }
    inputs.push(getInput('KeywordSearch.Editor', $('#editorFilter').val() != null ? $('#editorFilter').val() : null));
    //inputs.push(getInput('KeywordSearch.Writer', $('#writerFilter').data('kendoMultiSelect') != null ? $('#writerFilter').data('kendoMultiSelect').dataItems() : null));
    inputs.push(getInput('KeywordSearch.Status', $('#statusFilter').val() != null ? $('#statusFilter').val(): null));
    inputs.push(getInput('KeywordSearch.Stream', $('#streamFilter').val() != null ? $('#streamFilter').val() : null));
    inputs.push(getInput('KeywordSearch.Action', $('#versionFilter').val() != null ? $('#versionFilter').val() : null));
    inputs.push(getInput('KeywordSearch.AssetType', $('#assetTypeFilter').val() != null ? $('#assetTypeFilter').val() : null));
        
    if (exportType === "smartexcel" || exportType === "addtSmartExcel")
        inputs.push(getInput('isSmartExport', true));
    else
        inputs.push(getInput('isSmartExport', false));

    return inputs;
}

function getInput(name, value) {
    var input = document.createElement('input');
    input.name = name;
    input.value = (value != null) ? value : '';
    input.type = 'hidden';

    return input;
}

function dateReviver(key, value) {
    var a;
    if (typeof value === 'string') {
        a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
        if (a) {
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                +a[5], +a[6]));
        }
    }
    return value;
}

function dateUnreviver(key, value) {
    return dateParser(value);
}

function dateParser(value) {
    var a;
    if (typeof value === 'string') {
        a = /Date\(([^)]+)\)/.exec(value);
        if (a) {
            var dt = new Date(parseFloat(a[1]));
            return (dt.getUTCMonth() + 1) + "/" + dt.getUTCDate() + "/" + dt.getUTCFullYear();
        }
    }
    return value;
}
function onDataBound() {
    var filteredcount = $('#grid').data('kendoGrid').dataSource.total();
    if (filteredcount != total) {
        $('#lblFilteredResults').show();
        $('#lblFilteredResults').html(filteredcount + ' filtered results displayed out of ' + total + ' total results');
        $('#lblNoResults').hide();
    }
    else {
        $('#lblFilteredResults').empty();
        $('#lblFilteredResults').hide();
        $('#lblNoResults').show();
    }
    doubleScroll();
}
function doubleScroll() {
    var dataElement = $(".k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("table[role='grid']").minHeight + "px");
    var fakeScroll = document.getElementById("scroll");
    fakeScroll.style.width = $("table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapper').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapper').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapper').scrollLeft());
    });
}

function doubleScrollReserve() {
    var dataElement = $("#Reservations .k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("#Reservations table[role='grid']").minHeight + "px");
    var fakeScroll = document.getElementById("scrollReserve");
    fakeScroll.style.width = $("#Reservations table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapperReserve').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapperReserve').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapperReserve').scrollLeft());
    });
}

function doubleScrollMonthlyVisitor() {
    var dataElement = $("#MonthlyVistorMetrics .k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("#MonthlyVistorMetrics table[role='grid']").minHeight + "px");
    var fakeScroll = document.getElementById("scrollMonthlyVisitor");
    fakeScroll.style.width = $("#MonthlyVistorMetrics table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapperMonthlyVisitor').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapperMonthlyVisitor').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapperMonthlyVisitor').scrollLeft());
    });
}

function doubleScrollMonthlyPV() {
    var dataElement = $("#MonthlyPageViewMetrics .k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("#MonthlyPageViewMetrics table[role='grid']").minHeight + "px");
    var fakeScroll = document.getElementById("scrollMonthlyPV");
    fakeScroll.style.width = $("#MonthlyPageViewMetrics table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapperMonthlyPV').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapperMonthlyPV').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapperMonthlyPV').scrollLeft());
    });
}

function doubleScrollProductURL() {
    var dataElement = $("#ProductUrls .k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("#ProductUrls table[role='grid']").minHeight + "px");
    var fakeScroll = document.getElementById("scrollProductUrl");
    fakeScroll.style.width = $("#ProductUrls table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapperProductUrl').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapperProductUrl').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapperProductUrl').scrollLeft());
    });
}

//function BundleDetails(bundleId, sdrd) {
//    var ddlAction = document.getElementById(bundleId + sdrd);
//    localStorage["actionType"] = $(ddlAction).val();
//    window.location.href = '/BundleDetails/' + bundleId + "?actionType=" + $(ddlAction).val();
//}

function doubleScrollTUGUrls() {
    var fakeScroll = document.getElementById("scrollTUGUrls");
    if (fakeScroll === null)
        return;
    var dataElement = $("#TUGUrlsgrid .k-grid-content.k-auto-scrollable");
    dataElement.css('height', $("#TUGUrlsgrid table[role='grid']").minHeight + "px");

    fakeScroll.style.width = $("#TUGUrlsgrid table[role='grid']").width() + "px";
    $(dataElement).scroll(function () {
        $('#scrollWrapperTUGUrls').scrollLeft(dataElement.scrollLeft());
    });
    $('#scrollWrapperTUGUrls').scroll(function () {
        $(dataElement).scrollLeft($('#scrollWrapperTUGUrls').scrollLeft());
    });
}

function onChangeHyper(e) {
    var grid = e.sender.element.closest(".k-grid").data("kendoGrid");
    var row = e.sender.element.closest("tr");
    var dataItem = grid.dataItem(row);
    var hyperTargetIncl = e.sender.element.data("kendoMultiSelect");
    var selectedData = hyperTargetIncl.value();

    $.each(dataItem.InclHyperTargets, function (index, value) {
        // Get value in alert  
        //alert(value.GeoId);
    });
}

function onSelectHyper(data, geoType) {
    let promise = new Promise((resolve, reject) => {
        var selectedInclGeos = [];
        var selectedExclGeos = [];
        var selectedGeosData = null;
        var selectedGeosExclData = null;
        //console.log('onSelectHyper entry, argument data = ',data)
        if (data.inclHyperTargets !== null) {
            selectedGeosData = '';
            selectedInclGeos = [];
            $.each(data.inclHyperTargets, function (index, value) {
                selectedGeosData = selectedGeosData + value.geoId + ',';
                selectedInclGeos.push(value.geoId);
            });
        }

        if (data.exclHyperTargets !== null) {
            selectedGeosExclData = '';
            selectedExclGeos = [];
            $.each(data.exclHyperTargets, function (index, value) {
                selectedGeosExclData = selectedGeosExclData + value.geoId + ',';
                selectedExclGeos.push(value.geoId);
            });
        }
        var stringToSend = JSON.stringify({
            'includedgeoIds': selectedGeosData, 'excludedgeoIds': selectedGeosExclData, 'geoType': geoType
        })
        $.ajax({
            type: 'POST',
            url: window.location.origin + '/UrlBundle/GetUrlHyperTargets',
            data: JSON.stringify(stringToSend),
            contentType: 'application/json;',
            success: function (result) {
                resolve(result);
            },
            error: function (err) {
                console.log('error in onSelectHyper in aim.js: ', err);
                reject(err);
            }
        });
    })
    return promise;
}

function SelectReadOnly(selectId, readonly) {
    if (readonly) {
        $('#' + selectId + ' option:not(:selected)').attr('disabled', 'disabled');
    }
    else {
        $('#' + selectId + ' option[disabled]').removeAttr('disabled');
    }
}

function Deselected(e) {
    var grid = e.sender.element.closest(".k-grid").data("kendoGrid");
    var row = e.sender.element.closest("tr");
    var dataItem = grid.dataItem(row);
    var hyperTargetIncl = e.sender.element.data("kendoMultiSelect");
    var selectedData = hyperTargetIncl.value();
    if (dataItem.InclHyperTargets !== null)
        $.each(dataItem.InclHyperTargets, function (index, value) {
            console.log(value.GeoId);
        });
}
function getAvailability() {
    var dataItem = $(".k-edit-cell").closest(".k-grid").data("kendoGrid").dataItem($(".k-edit-cell").closest("tr"));
    //alert(dataItem.Availability);
    if (dataItem !== undefined && dataItem !== null) {
        return {
            availabilityStatus: dataItem.Availability
        };
    }
    else {
        return {
            availabilityStatus: null
        };
    }
}
function onGeoChange(e) { //unsure where to call this / where it's called
    alert("Bundle, Please click on \"Check Availability\" to get latest Availability.");
}

function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    if (sURLVariables != 'null') {
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }
}
function GetTabulatorDefaultColumns(searchType) {
    switch (searchType) {
        case 'Product': return [
            {
                title: "Details", field: "details", formatter: function (cell) {
                    var productId = cell.getRow().getData().productId;
                    var htmlString = "<input type='button' value= 'URLs' class='LinkButtons' onclick=\"subtableURLs('" + String(productId) + "')\"/>";
                    return htmlString;
                },
            },
            {
                title: "Reservation", field: "reservations", sorter: "string", formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var productId = rowData.productId;
                    var reservations = rowData.reservations;
                    var htmlString;
                    if (reservations != "No")
                        htmlString = "<input type='button' value= '" + reservations + "' class='LinkButtons' onclick=\"subtableReservation('" + String(productId) + "')\"/>";
                    else htmlString = String(reservations);

                    return htmlString;
                },
            },
            { title: "Runtime/System", field: "system_RunTime", sorter: "string" },
            { title: "Channel", field: "channel", sorter: "string" },
            { title: "Product", field: "product", sorter: "string" },
            { title: "Package Type", field: "packageType", sorter: "string" },
            { title: "Package Name", field: "package", sorter: "string" },
            {
                title: "Default URL", field: "url", sorter: "string", formatter: "link", formatterParams: {
                    labelField: "url",
                    urlPrefix: "http://",
                    target: "_blank",
                }
            },
            {
                title: "URL Status", field: "assetStatus", sorter: "boolean", formatter: function (cell) {
                    if (cell.getValue())
                        return 'Active';                    
                    else return 'Inactive';
                }
            },
            {
                title: "Needs Review", field: "needsReview", sorter: "boolean", formatter: function (cell) {
                    if (cell.getValue())
                        return 'Yes';
                    else return 'No';
                }
            },
            {
                title: "Monthly Visitor Avg", field: "visitorsLast12Months", sorter: "number", formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var htmlString = "<input type='button' value= '" + rowData.visitorsLast12Months + "' class='LinkButtons' onclick=\"subtableMVA('" + String(rowData.url) + "')\"/>";
                    return htmlString;
                },
            },
            {
                title: "Monthly PV Avg", field: "pageViewsLast12Months", sorter: "number", formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var htmlString = "<input type='button' value= '" + rowData.pageViewsLast12Months + "' class='LinkButtons' onclick=\"subtableMPA('" + String(rowData.url) + "')\"/>";
                    return htmlString;
                },
            },
            { title: "Primary Topic ID", field: "primaryTopic", sorter: "string", visible: false },
            { title: "Keywords", field: "keywords", sorter: "string", visible: false },
            { title: "Publication Source", field: "publicationSource", sorter: "string", visible: false },
            { title: "Client Brand Program", field: "clientBrandProgram", sorter: "string", visible: false },

        ];
            break;
        case 'ProductReservation':
            return [
                {
                    title: "Availability", field: "availability", sorter: "string", formatter: function(cell) {
                        let rowData = cell.getRow().getData();
                        let value = cell.getValue();
                        if (value == 'available')
                            return "<input type='button' id='" + rowData.productId +"availabilities' value= '" + value  + "' class='availabilities LinkButtons' />"
                        else return String(value);
                    }
                },
                {
                    title: "Details", field: "details", sorter: "string", formatter: function (cell) {
                        let rowData = cell.getRow().getData();
                        /*return `<a class='productUrls' href='\\#'> URLs </a>`*/
                        return "<input type='button' id='" + rowData.productId + "productUrls' value= 'URLs' class='productUrls LinkButtons' />"

                    }
                },
                { title: "System_RunTime", field: "system/RunTime", sorter: "string"},
                { title: "Channel", field: "channel", sorter: "string" },
                { title: "Product", field: "product", sorter: "string" },                
                { title: "Package", field: "package", sorter: "string" },
                {
                    title: "Default Url", field: "url", sorter: "string", formatter: "link"
                },
                {
                    title: "URL Status", field: "assetStatus", sorter: "string", formatter: function (cell) {
                        let value = cell.getValue();
                        if (value)
                            return 'Active';
                        return 'Inactive';
                    }
                },
                {
                    title: "Needs Review", field: "needsReview", sorter: "string", formatter: function (cell) {
                        let value = cell.getValue();
                        if (value)
                            return 'Yes';
                        return 'No';
                    }
                },
                { title: "Monthly Visitor Avg", field: "visitorsLast12Months", sorter: "string" },
                { title: "Monthly PV Avg", field: "pageViewsLast12Months", sorter: "string" },
                { title: "Primary Topic ID", field: "PrimaryTopic", sorter: "string", visible: false  },
                { title: "Keywords", field: "keywords", sorter: "string", visible: false },
                { title: "Publication Source", field: "publicationSource", sorter: "string", visible: false },
                { title: "ProductId", field: "productId", sorter: "string", visible: false  },                
            ];
            break;
        case 'ADDitude': return [
            { title: "Lock", formatter: LockFormatter },
            { title: "Action", width: 125, formatter: ActionFormatter },
            { title: "Bundle ID", field: "bundleID", sorter: "string" },
            { title: "Name", field: "name", width: 300, sorter: "string", formatter: "textarea" },
            { title: "Type", field: "bundleType", sorter: "string", formatter: "textarea" },
            { title: "Status", field: "bundleStatus", sorter: "string" },

            {
                title: "Res Start", field: "resStartDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resStartDate);
                    var dateB = new Date(bRow.getData().resStartDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res End", field: "resEndDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resEndDate);
                    var dateB = new Date(bRow.getData().resEndDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "Modified By", field: "modifiedBy", sorter: "string" },
            {
                title: "Modified Date", field: "modifiedDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().modifiedDate);
                    var dateB = new Date(bRow.getData().modifiedDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
        ];
            break;
        case 'EditorialTracker': return [
            {
                title: "Actions", field: "actions", width: 280, formatter
            },
            { title: "EAID", field: "eaId", sorter: "number", visible: false },
            {
                title: "Locked By", field: "lockedBy",visible: false
            },
            {
                title: "Date Started", field: "dateStarted", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().dateStarted);
                    var dateB = new Date(bRow.getData().dateStarted);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "Editor", field: "editor", sorter: "string", titleDownload: "editor" },
            { title: "Status", field: "status", sorter: "string", titleDownload: "status" },
            {
                title: "Handed Off Date", field: "handedOffDate", visible: false, sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().handedOffDate);
                    var dateB = new Date(bRow.getData().handedOffDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "Writer", field: "writer", sorter: "string", titleDownload: "writer", visible: false },
            { title: "Stream", field: "stream", sorter: "string", titleDownload: "stream" },
            { title: "AssetType", field: "assetType", sorter: "string", titleDownload: "assetType" },
            { title: "Action", field: "action", sorter: "string", titleDownload: "action" },
            { title: "Title", field: "title", sorter: "string", titleDownload: "title" },
            { title: "SF #", field: "sfid", sorter: "string", titleDownload: "sfId", visible: false },

            { title: "Client Brand", field: "client", sorter: "string", titleDownload: "clientBrandProgram", visible: false },
            { title: "Channel", field: "channel", sorter: "string", titleDownload: "channel" },
            { title: "TopicId", field: "topicId", sorter: "string", titleDownload: "topicId" },
            { title: "Window Title", field: "windowTitle", sorter: "string", titleDownload: "windowTitle", visible: false },
            { title: "User Description", field: "userDescription", sorter: "string", titleDownload: "userDescription", visible: false },
            {
                title: "OriginalPublicationDate", field: "originalPublicationDate", visible: false, sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().originalPublicationDate);
                    var dateB = new Date(bRow.getData().originalPublicationDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "SpecialProject", field: "specialProject", sorter: "string", titleDownload: "specialProject", visible: false },
            { title: "DCTM ID", field: "dctmid", sorter: "string", titleDownload: "DCTMID" },
            { title: "PriorityTopic", field: "priorityTopic", sorter: "string", titleDownload: "priorityTopic", visible: false},
            {
                title: "Url", field: "url", sorter: "string", titleDownload: "url", formatter: "link", visible: false, formatterParams: {
                    labelField: "url",
                    target: "_blank",
                }
            },
            { title: "Reason", field: "reason", sorter: "string", titleDownload: "reason", visible: false },
            { title: "Franchise", field: "franchise", sorter: "string", titleDownload: "franchise", visible: false },
            { title: "VideoEditor", field: "videoEditor", sorter: "string", titleDownload: "videoEditor", visible: false },
            { title: "ProductionCo", field: "productionCo", sorter: "string", titleDownload: "productionCo", visible: false },
            {
                title: "LaunchDate", field: "launchDate", visible: false, sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().launchDate);
                    var dateB = new Date(bRow.getData().launchDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "OpsWritten", field: "opsWritten", sorter: "number", titleDownload: "opsWritten", visible: false },
            { title: "OpsVideo", field: "opsVideo", sorter: "number", titleDownload: "opsVideo", visible: false },

            { title: "TotalSlides", field: "totalSlides", sorter: "number", titleDownload: "totalSlides", visible: false },
            { title: "Monthly Visitor Avg", field: "visitorsLast12Months", sorter: "number", titleDownload: "visitorsLast12Months", visible: false },



            { title: "Monthly PV Avg", field: "pageViewsLast12Months", sorter: "number", titleDownload: "pageViewsLast12Months", visible: false },

            { title: "IsCMSDataUpdated", field: "isCMSDataUpdated", sorter: "boolean", titleDownload: "isCMSDataUpdated", visible: false },
            { title: "IsClientUpdated", field: "isClientUpdated", sorter: "boolean", titleDownload: "isClientUpdated", visible: false },
        ];
            break;
        case 'Reservation': return [
            { title: "Res Status", field: "status", sorter: "string" },
            { title: "Geo-Targeting", field: "geoName", sorter: "string" },
            {
                title: "SF#", field: "sf", sorter: "string", formatter: getHyperLinkForSF
            },
            { title: "Client", field: "masterCustomer", sorter: "string" },
            { title: "Brand", field: "accountName", sorter: "string" },
            { title: "Mktg Owner", field: "marketingOwner", sorter: "string" },
            { title: "Sales Rep", field: "sdrOwner", sorter: "string", titleDownload: "sdrOwner" },
            {
                title: "SDRR#", field: "sdrr", sorter: "string", visible: false, formatter: getHyperLinkForSDRR
                
            },
            { title: "SDRR Status", field: "sdrrStatus", sorter: "string", visible: false },
            {
                title: "SDRD#", field: "sdrd", sorter: "string", formatter: getHyperLinkForSDRD
            },
            { title: "SDRD Status", field: "sdrdStatus", sorter: "string", visible: false },
            { title: "Common Product Name", field: "commonProductName", sorter: "string" },
            {
                title: "Product/Bundle Name", field: "editorialTitle", sorter: "string", formatter: function (cell) {
                    return `<input type='button' value= '${cell.getValue()}' class='LinkButtons ProductSubtableButton' data-celldata='${JSON.stringify(cell.getRow().getData())}'/>`;
                }
            },
            { title: "Bundle Type", field: "bundleType", sorter: "string" },
            {
                title: "Bundle ID", field: "bundleId", sorter: "string", formatter: getHyperLinkForBundleID

                
            },
            { title: "TUG ID", field: "tugId", sorter: "string" },
            {
                title: "Res Start", field: "startDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().startDate);
                    var dateB = new Date(bRow.getData().startDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res End", field: "endDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().endDate);
                    var dateB = new Date(bRow.getData().endDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
        ];
            break;
        case 'URLBundle': return [
            { title: " ", formatter: LockFormatter, headerSort: false, width: 40 },
            { title: "Action", width: 125, formatter: ActionFormatter },
            { title: "Bundle ID", field: "bundleID", sorter: "string" },
            { title: "Name", field: "name", width: 300, sorter: "string", formatter: "textarea" },
            { title: "Type", field: "bundleType", sorter: "string", formatter: "textarea" },
            { title: "Status", field: "bundleStatus", sorter: "string" },
            { title: "Client", field: "client", sorter: "string", visible: false },
            { title: "Sales Rep", field: "salesRep", sorter: "string", visible: false },
            { title: "Marketing Rep", field: "marketingRep", sorter: "string", visible: false },
            { title: "SF #", field: "salesForceId", sorter: "string" },
            { title: "SDRD #", field: "sdrd", sorter: "string" },
            { title: "SDRD Status", field: "sdrdStatus", sorter: "string", visible: false },
            {
                title: "Res Start", field: "resStartDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resStartDate);
                    var dateB = new Date(bRow.getData().resStartDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res End", field: "resEndDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resEndDate);
                    var dateB = new Date(bRow.getData().resEndDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res Exp Date", field: "resExpDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resExpDate);
                    var dateB = new Date(bRow.getData().resExpDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "TUG ID", field: "tugId", sorter: "string" },
            { title: "Client Brand Program", field: "clientBrandProgram", sorter: "string", visible: false },
            { title: "TUG Status", field: "tugStatus", sorter: "string" },
            {
                title: "TUG Publish Date", field: "tugPublishDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().tugPublishDate);
                    var dateB = new Date(bRow.getData().tugPublishDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "TUG Remove Date", field: "tugRemoveDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().tugRemoveDate);
                    var dateB = new Date(bRow.getData().tugRemoveDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "Modified By", field: "modifiedBy", sorter: "string" },
            {
                title: "Modified Date", field: "modifiedDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().modifiedDate);
                    var dateB = new Date(bRow.getData().modifiedDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "Brand", field: "brand", sorter: "string" },

        ];
            break;
        case 'Url': return [
            {
                title: "Reservations", field: "reservations", sorter: "string", titleDownload: "reservations", formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var ResData = {};
                    ResData.productId = rowData.productID;
                    ResData.url = rowData.url;
                    ResData.start = null;
                    ResData.end = null;
                    ResData.AId = rowData.aId;
                    ResData.hyperTargetsIncl = null;
                    ResData.hyperTargetsExcl = null;
                    ResData.resStatus = rowData.reservations === "Yes (Geo)" ? 2 : rowData.reservations === "Yes" ? 1 : 0;
                    var htmlString;

                    if (rowData.reservations != "No")
                        htmlString = "<input type='button' value= '" + rowData.reservations + "' class='LinkButtons' onclick=\"subtableReservation('" + String(rowData.aId) + "')\"/>";
                    else
                        htmlString = String(rowData.reservations);
                    return htmlString;
                },
            },
            {
                title: "Is Sponsored", field: "isSponsored", sorter: "string", formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var htmlString;


                    if (rowData.isSponsored != "No")
                        htmlString = "<input type='button' value= '" + rowData.isSponsored + "' class='LinkButtons' onclick=\"subtableIsSponsored('" + String(rowData.aId) + "')\"/>";
                    else
                        htmlString = String(rowData.isSponsored);

                    return htmlString;
                },
            },
            { title: "Res Details", field: "resDetails", sorter: "string", titleDownload: "resDetails", visible: false },
            { title: "System_RunTime", field: "system_RunTime", sorter: "string", titleDownload: "system_RunTime", visible: false },
            {
                title: "URL Status", field: "assetStatus", sorter: "boolean", titleDownload: "assetStatus", visible: false, formatter: function (cell) {
                    if (cell.getValue())
                        return 'Active';
                    else return 'Inactive';
                }
            },
            {
                title: "Full Url", field: "url", sorter: "string", titleDownload: "url", formatter: "link", formatterParams: {
                    labelField: "url",
                    urlPrefix: "http://",
                    target: "_blank",
                }
            },
            { title: "Asset Id", field: "assetId", sorter: "string", titleDownload: "assetId" },
            { title: "Title", field: "assetTitle", sorter: "string", titleDownload: "assetTitle" },
            { title: "Newsletter Title", field: "newsletterTitle", sorter: "string", titleDownload: "newsletterTitle", visible: false },
            { title: "Newsletter Description", field: "newsletterDescription", sorter: "string", titleDownload: "newsletterDescription", visible: false },
            {
                title: " Archive Flag", field: "assetArchived", sorter: "string", titleDownload: "assetArchived", visible: false, formatter: function (cellComp) {
                    var cellData = cellComp.getData();
                    if (cellData.assetArchived == "t") {
                        return "Yes";
                    }
                    else if (cellData.assetArchived == "f") {
                        return "No";
                    }
                }
            },
            {
                title: "Med Review Date",
                field: "medReviewDate",
                sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().medReviewDate);
                    var dateB = new Date(bRow.getData().medReviewDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
                titleDownload: "medReviewDate",
                visible: false
            }, {
                title: "Orig Pub Date", field: "publicationDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().publicationDate);
                    var dateB = new Date(bRow.getData().publicationDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                }, titleDownload: "publicationDate", visible: false
            },
            { title: "Channel", field: "channel", sorter: "string", titleDownload: "channel" },
            { title: "Content Classification", field: "businessReference", sorter: "string", titleDownload: "businessReference", visible: false },
            { title: "Publication Source", field: "publicationSource", sorter: "string", titleDownload: "publicationSource" },
            { title: "Indication", field: "indication", sorter: "string", titleDownload: "indication", visible: false },
            { title: "Outline Title", field: "topicOutlineName", sorter: "string", titleDownload: "topicOutlineName" },
            { title: "Primary Topic ID", field: "primaryTopic", sorter: "string", titleDownload: "primaryTopic", visible: false },
            { title: "Brand Names", field: "brandNames", sorter: "string", titleDownload: "brandNames", visible: false },
            { title: "Generic Name", field: "genericName", sorter: "string", titleDownload: "genericName", visible: false },
            { title: "Active Ingredients", field: "activeIngredient", sorter: "string", titleDownload: "activeIngredient", visible: false },
            { title: "DrugType", field: "drugType", sorter: "string", titleDownload: "drugType", visible: false },
            { title: "Description", field: "description", sorter: "string", titleDownload: "description", visible: false },
            { title: "IsGeneric", field: "isGeneric", sorter: "boolean", titleDownload: "isGeneric", visible: false },
            { title: "Keywords", field: "keywords", sorter: "string", titleDownload: "keywords", visible: false },
            { title: "Asset Name", field: "assetName", sorter: "string", titleDownload: "assetName", visible: false },
            { title: "Package Type", field: "origPackageType", sorter: "string", titleDownload: "origPackageType" },
            { title: "Product", field: "product", sorter: "string", titleDownload: "product", visible: false },
            { title: "Package Name", field: "package", sorter: "string", titleDownload: "package" },
            { title: "Client Brand Program", field: "clientBrandProgram", sorter: "string", titleDownload: "clientBrandProgram" },
            {
                title: "Monthly Visitor Avg", field: "visitorsLast12Months", sorter: "number", titleDownload: "visitorssLast12Months", visible: false, formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var htmlString = "<input type='button' value= '" + rowData.visitorsLast12Months + "' class='LinkButtons' onclick=\"subtableMVA('" + String(rowData.url) + "')\"/>";
                    return htmlString;
                },
            },
            {
                title: "Monthly PV Avg", field: "pageViewsLast12Months", sorter: "number", titleDownload: "pageViewsLast12Months", visible: false, formatter: function (cell) {
                    var rowData = cell.getRow().getData();
                    var htmlString = "<input type='button' value= '" + rowData.pageViewsLast12Months + "' class='LinkButtons' onclick=\"subtableMPA('" + String(rowData.url) + "')\"/>";
                    return htmlString;
                },},
            { title: "ProductID", field: "productID", sorter: "string", titleDownload: "productID", visible: false },
            { title: "AId", field: "aId", sorter: "string", titleDownload: "aId", visible: false },
         

        ];
            break;
        case 'BrandSeeker': return [
            { title: "Status", field: "resStatus", sorter: "string" },
            { title: "Bundle", field: "bundleId", sorter: "string", formatter: getHyperLinkForBundleID },
            { title: "Name", field: "name", sorter: "string" },
            { title: "Client", field: "client", sorter: "string" },
            { title: "Sales Rep", field: "salesRep", sorter: "string" },
            { title: "Marketing Rep", field: "marketingRep", sorter: "string" },
            { title: "SF #", field: "sfNumber", sorter: "string", formatter: getHyperLinkForSF },
            { title: "SDRD #", field: "sdrdNumber", sorter: "string", formatter: getHyperLinkForSDRD },
            {
                title: "Res Start", field: "resStartDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resStartDate);
                    var dateB = new Date(bRow.getData().resStartDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res End", field: "resEndDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resEndDate);
                    var dateB = new Date(bRow.getData().resEndDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "TUGId", field: "tugId", sorter: "string" },
        ];
            break;
        case 'PatientSelect': return [
            { title: "Status", field: "resStatus", sorter: "string" },
            { title: "Bundle", field: "bundleId", sorter: "string", formatter: getHyperLinkForBundleID },
            { title: "Name", field: "name", sorter: "string" },
            { title: "Client", field: "client", sorter: "string" },
            { title: "Sales Rep", field: "salesRep", sorter: "string" },
            { title: "Marketing Rep", field: "marketingRep", sorter: "string" },
            { title: "SF #", field: "sfNumber", sorter: "string", formatter: getHyperLinkForSF },
            { title: "SDRD #", field: "sdrdNumber", sorter: "string", formatter: getHyperLinkForSDRD },
            {
                title: "Res Start", field: "resStartDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resStartDate);
                    var dateB = new Date(bRow.getData().resStartDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            {
                title: "Res End", field: "resEndDate", sorter: function (a, b, aRow, bRow, column, dir, sorterParams) {
                    var dateA = new Date(aRow.getData().resEndDate);
                    var dateB = new Date(bRow.getData().resEndDate);

                    if (dateA < dateB) {
                        return -1;
                    } else if (dateA > dateB) {
                        return 1;
                    }

                    return 0;
                },
                formatter: function (cell, formatterParams, onRendered) {
                    var date = new Date(cell.getValue());
                    var formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    return formattedDate;
                },
            },
            { title: "TUGId", field: "tugId", sorter: "string" },
        ];
            break;
        default: alert('Error: searchType (' + searchType + ') is undefined/unimplemented');
            return false;
    }
}
function InitializePopupAttrs(id, minHeight, minWidth, maxHeight, maxWidth) {
    $(id)
        .css({
            top: 0,
            left: 0
        })
        .resizable({
            minWidth: minWidth ? minWidth : null,
            minHeight: minHeight ? minHeight : null,
            maxWidth: maxWidth ? maxWidth : null,
            maxHeight: maxHeight ? maxHeight : null,
            handles: 'n, e, s, w, ne, sw, se, nw',
        })
        .draggable({
            containment: [0, -45, $(window).width(), $(window).height()],
            handle: '.modal-header'
        })
}
function ResetPopupPosition(id, width, height, top, left) {
    $(id).find('.modal-content')
        .css({
            top: 0,
            left: 0,
        })
        .width(width)
        .height(height)
        .offset({
            left: left,
            top: top
        });
}

function ShowWarning(title, message, btnText, callback) {
    $('#WarningModal').modal('show');
    $('#WarningModal .modal-title').text(title);
    $('#warninfContent').text(message);
    $('#btnWarninfConfirm').text(btnText);
    $('#btnWarninfConfirm')[0].addEventListener('click', callback);
}

function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(window).on('load', function () {
    setTimeout(showPage, 2000); //wait for page load PLUS two seconds.
});
function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("myDiv").style.display = "block";
    document.getElementById("myDiv").style.filter = "none";
}

function Start() {
    document.getElementById("loader").style.display = "block";
   
  
}

function Stop() {
    document.getElementById("loader").style.display = "none";


}

function ValidateEmail(email) {
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (email.match(validRegex)) {
        return true;
    } else {
        alert("Please provide a valid email to proceed.")
        return false;
    }
}

function sendExportEmail() {
    var userEmail = '';
    userEmail = $('#userEmail').val();
    console.log("new----");
    if (ValidateEmail(userEmail)) {
        //var requestObject = (new kendo.data.transports['aspnetmvc-server']({ prefix: '' }))
        //    .options.parameterMap({
        //        sort: grid.dataSource.sort(),
        //        filter: grid.dataSource.filter()
        //    });
        //var sort = '&sort=' + requestObject.sort;
        //var filter = '&filter=' + requestObject.filter;
        //var request = filter + sort;
        if (search.SearchType==2) {
            search.GeoTargets = $('#GeoTargets').val() != null ? $('#GeoTargets').val() : null;
            search.KeywordSearch.GeoTargetsExcl = $('#GeoTargetsExcl').val() != null ? $('#GeoTargetsExcl').val() : null;
        }
        var stringToSend = JSON.stringify(
            {
                'search': JSON.parse(JSON.stringify(search), dateUnreviver),
                'userEmail': userEmail
            });
        stringToSend = "{\"JSON\": \"" + encodeURIComponent(stringToSend) + "\"}";
        $.ajax({
            type: 'post',
            url: '/UrlSearch/ExportResultsEmail',
            dataType: 'json',
            data: stringToSend,
            cache: false,
            contentType: 'application/json; charset=utf-8',
            success: function (result) {
                console.log('Export completed.');
            }
        });
        $('#emailExportModal').modal('hide')
        $.alert({
            title: 'Export',
            content: 'Your Excel report is being generated, you will receive an email with the link to download the file. Please check your mailbox later.',
        });
       // alert("Your Excel report is being generated, you will receive an email with the link to download the file. Please check your mailbox later.")
    }
}
