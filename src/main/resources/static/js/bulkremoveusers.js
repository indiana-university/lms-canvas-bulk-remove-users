$('#checkbox-all').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox');
    checkboxes.prop('checked', $(this).is(':checked'));
    $("#checkbox-teachers").prop("indeterminate", false);
    $("#checkbox-students").prop("indeterminate", false);
    $("#checkbox-tas").prop("indeterminate", false);
    $("#checkbox-designers").prop("indeterminate", false);
    $("#checkbox-observers").prop("indeterminate", false);
    userSelectedCounter();
});

$('#checkbox-teachers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="TeacherEnrollment"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-students').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="StudentEnrollment"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-tas').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="TaEnrollment"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-designers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="DesignerEnrollment"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('#checkbox-observers').change(function() {
    var checkboxes = $(this).closest('form').find(':checkbox[data-attribute="ObserverEnrollment"]');
    checkboxes.prop('checked', $(this).is(':checked'));
    userSelectedCounter();
    updateAllUsersBox();
});

$('input[name="user"]').click(function() {
    // All users section
    updateAllUsersBox();

    // Teachers section
    var teacherTotal = $(this).closest('form').find(':checkbox[data-attribute="TeacherEnrollment"]').length;
    var teacherChecked = $(this).closest('form').find(':checkbox[data-attribute="TeacherEnrollment"]:checked').length;

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
    var studentTotal = $(this).closest('form').find(':checkbox[data-attribute="StudentEnrollment"]').length;
    var studentChecked = $(this).closest('form').find(':checkbox[data-attribute="StudentEnrollment"]:checked').length;
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
    var taTotal = $(this).closest('form').find(':checkbox[data-attribute="TaEnrollment"]').length;
    var taChecked = $(this).closest('form').find(':checkbox[data-attribute="TaEnrollment"]:checked').length;
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
    var designerTotal = $(this).closest('form').find(':checkbox[data-attribute="DesignerEnrollment"]').length;
    var designerChecked = $(this).closest('form').find(':checkbox[data-attribute="DesignerEnrollment"]:checked').length;
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
    var observerTotal = $(this).closest('form').find(':checkbox[data-attribute="ObserverEnrollment"]').length;
    var observerChecked = $(this).closest('form').find(':checkbox[data-attribute="ObserverEnrollment"]:checked').length;
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

    // enable/disable buttons while we're in here
    if (newValue > 0) {
        $(".modalButton").removeAttr('disabled');
        $(".modalButton").attr('aria-disabled', 'false');
    } else {
        $(".modalButton").attr('disabled', '');
        $(".modalButton").attr('aria-disabled', 'true');
    }
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
            var dupeBonus = "";
            var isDupe = (this.getAttribute('data-is-dupe') === 'true');
            if (isDupe) {
                separator = " - ";
                var role = $(this).closest('tr').find('.role').text();
                var section = $(this).closest('tr').find('.section').text();
                dupeBonus = " - " + role + " (" + section + ")";
            }
            $(modalList).append("<li>" + displayName + " (" + username + ")" + dupeBonus + "</li>")
        }
    });
});

$('#dialog-submit').click(function() {
    // set all the loading icon things for the 'Yes, remove' button
    var button = $(this);
    button.addClass("rvt-button--loading");
    button.prop('disabled', 'true');
    button.attr('aria-busy', 'true');
    button.append('<div class="rvt-loader rvt-loader--xs" aria-label="Content loading"></div>');

    // disable the cancel button
    $("#dialog-cancel").attr('disabled', '');
    $("#dialog-cancel").attr('aria-disabled', 'true');

    // did not need this in testing, but leaving it in case it's a bug later
    // $('#bulk-remove-users-form').submit();
});