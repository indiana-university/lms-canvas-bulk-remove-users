$('#checkbox-all').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
});

$('#checkbox-teachers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="Teacher"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-students').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="Student"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-tas').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="TA"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-designers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="Designer"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-observers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="Observer"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('input[name="user"]').click(function() {
    // All users section
    updateAllUsersBox();

    // Teachers section
    var teacherTotal = $(this).closest('form').find(':checkbox[data-attribute="Teacher"]').length;
    var teacherChecked = $(this).closest('form').find(':checkbox[data-attribute="Teacher"]:checked').length;

    if (teacherChecked == 0) {
        $("#checkbox-teachers").prop("checked", false);
        $("#checkbox-teachers").prop("indeterminate", false);
    } else if (teacherTotal == teacherChecked) {
        $("#checkbox-teachers").prop("checked", true);
        $("#checkbox-teachers").prop("indeterminate", false);
    } else {
        $("#checkbox-teachers").prop("indeterminate", true);
    }

    // Students section
    var studentTotal = $(this).closest('form').find(':checkbox[data-attribute="Student"]').length;
    var studentChecked = $(this).closest('form').find(':checkbox[data-attribute="Student"]:checked').length;
    if (studentChecked == 0) {
        $("#checkbox-students").prop("checked", false);
        $("#checkbox-students").prop("indeterminate", false);
    } else if (studentTotal == studentChecked) {
        $("#checkbox-students").prop("checked", true);
        $("#checkbox-students").prop("indeterminate", false);
    } else {
        $("#checkbox-students").prop("indeterminate", true);
    }

    // TAs section
    var taTotal = $(this).closest('form').find(':checkbox[data-attribute="TA"]').length;
    var taChecked = $(this).closest('form').find(':checkbox[data-attribute="TA"]:checked').length;
    if (taChecked == 0) {
        $("#checkbox-tas").prop("checked", false);
        $("#checkbox-tas").prop("indeterminate", false);
    } else if (taTotal == taChecked) {
        $("#checkbox-tas").prop("checked", true);
        $("#checkbox-tas").prop("indeterminate", false);
    } else {
        $("#checkbox-tas").prop("indeterminate", true);
    }

    // Designers section
    var designerTotal = $(this).closest('form').find(':checkbox[data-attribute="Designer"]').length;
    var designerChecked = $(this).closest('form').find(':checkbox[data-attribute="Designer"]:checked').length;
    if (designerChecked == 0) {
        $("#checkbox-designers").prop("checked", false);
        $("#checkbox-designers").prop("indeterminate", false);
    } else if (designerTotal == designerChecked) {
        $("#checkbox-designers").prop("checked", true);
        $("#checkbox-designers").prop("indeterminate", false);
    } else {
        $("#checkbox-designers").prop("indeterminate", true);
    }

    // Observers section
    var observerTotal = $(this).closest('form').find(':checkbox[data-attribute="Observer"]').length;
    var observerChecked = $(this).closest('form').find(':checkbox[data-attribute="Observer"]:checked').length;
    if (observerChecked == 0) {
        $("#checkbox-observers").prop("checked", false);
        $("#checkbox-observers").prop("indeterminate", false);
    } else if (observerTotal == observerChecked) {
        $("#checkbox-observers").prop("checked", true);
        $("#checkbox-observers").prop("indeterminate", false);
    } else {
        $("#checkbox-observers").prop("indeterminate", true);
    }

    userSelectedCounter();
});

function userSelectedCounter() {
    var newValue = document.querySelectorAll('input[name="user"]:checked').length;
    $("#users-selected").text(newValue + ' selected');
}

function updateAllUsersBox() {
    // All users section
    var allTotal = document.querySelectorAll('input[name="user"]').length;
    var allChecked = document.querySelectorAll('input[name="user"]:checked').length;
    if (allTotal == allChecked) {
        $("#checkbox-all").prop("checked", true);
        $("#checkbox-all").prop("indeterminate", false);
    } else if (allChecked == 0) {
        $("#checkbox-all").prop("checked", false);
        $("#checkbox-all").prop("indeterminate", false);
    } else {
        $("#checkbox-all").prop("indeterminate", true);
    }
}

$(".modalButton").click(function() {
    // find the modal body
    var modalList = $("#edit-tool-properties").find(".modal-list");

    // clear the ul, in case a cancel button happened
    $(modalList).empty();

    // loop through all the check boxes (class checkbox)
    $('input[name="user"]').each(function(index) {
        // if they are checked, add them to the modal
        if($(this).is(":checked")) {
            var displayName = $(this).closest('tr').find('.displayName').text();
            var username = $(this).closest('tr').find('.username').text();
            $(modalList).append("<li>"+displayName+" ("+username+")</li>")
        }
    });
});
