

const formatter = (cell) => {

    var rowdata = cell.getRow();
    var id = rowdata._row.data.id;
    var name = rowdata._row.data.name;
    var status = rowdata._row.data.status;

    if (status == true) {
        return `
            <div class="">
                <button id='edit' data-toggle='modal' data-target='#update' class='btn-primary btn-sm mr-2' data-id='${id}'  data-name='${name}' title='Edit' >
                    <i class='fa fa-edit'></i>
                    Edit
                </button>
                <button id='retire${id}' value="Retire" class='btn-danger btn-sm redButtons' data-toggle='modal' data-target='#retire' data-id='${id}'  data-status='${status}' title=' Retires item back to an inactive status and will not be shown in the dropdowns in Editorial tracker' >
                    <i class="fa-solid fa-xmark"></i>
                    Retire
                  </button>
                   
            </div>
        `
    }
    else {
        return `
            <div class="">
                <button id='edit' data-toggle='modal' data-target='#update' class='btn-primary btn-sm mr-2' data-id='${id}'  data-name='${name}' title='Edit'>
                    <i class='fa fa-edit'></i>
                    Edit
                </button>
                <button id='restore${id}' value="Restore" class='btn-danger btn-sm redButtons' data-toggle='modal' data-target='#restore' data-id='${id}'  data-status='${status}' title=' Restores item back to active status and will be shown in Editorial Tracker'>
                    <i class="fa-solid fa-xmark"></i>
                    Restore
                  </button>
                   
            </div>
        `
    }
};

const tablecolumns = [
    { title: "", field: "actions", formatter, width:'13%'},
    { title: "Name", field: "name" },
    { title: "Lookup Name", field: "lookupName", visible: false },
    { title: "Id", field: "id", visible: false },
    { title: "Status", field: "status", visible: false },
];
 
const tabulator = new Tabulator('#editoriallookup-table', {
    data,
    pagination: "local",
    layout: "fitColumns",
    paginationSize: 10,
    paginationSizeSelector: [10, 25, 50, 75, 100],
    resizableRows: false,
    tooltips: true,
    columns: tablecolumns,
    height: '450px',
});



$("#lookup-name").change(function (e) {
    e.preventDefault();
    const lookupName = $(this).val()

    tabulator.setData("/Editorial/GetEditorialLookupsData", { lookupName }, "post")
})



$("#new-record-form").submit(function (e) {
    e.preventDefault();
    const name = $("#new-name").val();
    const lookupName = $("#lookup-name").val();
    var editorialLookup = {};

    editorialLookup.lookupName = lookupName;
    editorialLookup.name = name;
    try {
       
        $.ajax({
            type: 'POST',
            url: '/Editorial/CreateLookup',
            dataType: "json",
            async: false,
            data: JSON.stringify(
                editorialLookup
            ),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.value) {
                    alert(data.value)
                }

            },

        });
        $("#lookup-name").change();
    } catch (err) {
        console.error(err);
    } finally {
        $("#exampleModalCenter").modal('hide');
    }
})

$('#update').on('shown.bs.modal', function (e) {
    let btn = $(e.relatedTarget);
    const id = btn.data('id')
    const name = btn.data('name')

    $('#update-id').val(id)
    $('#update-name').val(name)
})

$('#retire').on('shown.bs.modal', function (e) {
    let btn = $(e.relatedTarget);
    const id = btn.data('id')
    const status = btn.data('status')

    $('#retire-id').val(id)
    $('#retire-status').val(status)
    
})

$('#restore').on('shown.bs.modal', function (e) {
    let btn = $(e.relatedTarget);
    const id = btn.data('id')
    const status = btn.data('status')

    $('#restore-id').val(id)
    $('#restore-status').val(status)
})


$("#update-record-form").submit(function (e) {
    e.preventDefault();
    const id = $("#update-id").val();
    const name = $("#update-name").val();
    const lookupName = $("#lookup-name").val();
    var editorialLookup = {};
    editorialLookup.id = id;
    editorialLookup.lookupName = lookupName;
    editorialLookup.name = name;
    try {
        $.ajax({
            type: 'POST',
            url: '/Editorial/UpdateLookup',
            dataType: "json",
            async: false,
            data: JSON.stringify(
                editorialLookup
            ),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.value) {
                    alert(data.value)
                }
            },
        });
        $("#lookup-name").change();
    }
    catch (err) {
        console.error(err);
    } finally {
        $("#update").modal('hide');
    }
})

$("#retire-record-form").submit(function (e) {
    e.preventDefault();
    const id = $("#retire-id").val();
    const x = $("#retire-status").val();
    const lookupName = $("#lookup-name").val();
  

    var status = x == "true" ? true : false;
    var editorialLookup = {};
    editorialLookup.id = id;
    editorialLookup.lookupName = lookupName;
    editorialLookup.status = status;

    console.log(editorialLookup);

    try {
        $.ajax({
            type: 'POST',
            url: '/Editorial/DeleteLookup',
            dataType: "json",
            async: false,
            data: JSON.stringify(
                editorialLookup
            ),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.value) {
                    alert(data.value)
                }
            },
        });
        $("#lookup-name").change();


    } catch (err) {
        console.error(err);
    } finally {
        $("#retire").modal('hide');
    }
 
 

})

$("#restore-record-form").submit(function (e) {
    e.preventDefault();
    const id = $("#restore-id").val();
    const x = $("#restore-status").val();
    const lookupName = $("#lookup-name").val();
    
    var status = x == "true" ? true : false;
    var editorialLookup = {};
    editorialLookup.id = id;
    editorialLookup.lookupName = lookupName;
    editorialLookup.status = status;
    console.log(editorialLookup);
    try {
        $.ajax({
            type: 'POST',
            url: '/Editorial/DeleteLookup',
            dataType: "json",
            async: false,
            data: JSON.stringify(
                editorialLookup
            ),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.value) {
                    alert(data.value)
                }
            },
        });
        $("#lookup-name").change();
    } catch (err) {
        console.error(err);
    } finally {
        $("#restore").modal('hide');
    }
    
   

   
})


