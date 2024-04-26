/*-
 * #%L
 * bulk-remove-users
 * %%
 * Copyright (C) 2022 Indiana University
 * %%
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the Indiana University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * #L%
 */

 $(document).ready(function() {
    applyAccessibilityOverrides();
 });

$('#appTable').on( 'draw.dt', function () {
    // after the table is drawn (on init, sort, search, etc) we need to apply the accessibility fixes again
    fixTableHeaders();
    labelCheckboxes();

} );

$("th.sorting").click(function() {
    sortingNotify($(this));
});

function labelCheckboxes() {
    $("th.userCheckbox").each( function() {
        // need to add a label pointing to the user's name in the username column
        let usernameCol = $(this).closest('tr').find('td.displayName')[0];
        let userCB = $(this).find('input[type=checkbox]')[0];
        $(userCB).attr("aria-labelledby", usernameCol.id);
        $(userCB).removeAttr("aria-label");
    });
}


function userSelectedCounter() {
    // Get all the selected checkboxes, except the "select-all" one up in the table header
    var newValue = document.querySelectorAll('input.dt-select-checkbox:checked:not(.header-checkbox)').length;
    $(".users-selected-text").text(newValue + ' selected');

    // enable/disable buttons while we're in here
    if (newValue > 0) {
        $(".modalButton").removeAttr('disabled');
        $(".modalButton").attr('aria-disabled', 'false');
    } else {
        $(".modalButton").attr('disabled', '');
        $(".modalButton").attr('aria-disabled', 'true');
    }
}

sortingNotify = function (sortHeader) {
    var sortBy = sortHeader.text();
    var direction = sortHeader.hasClass("sorting_asc") ? "ascending" : "descending";
    $("#sortingAnnc").text("Sorting by " + sortBy + " " + direction);
    //fixTableHeaders();
}


function addDescriptiveLabels() {
	$('div.dt-search').find('input[type=search]').attr('aria-describedby','searchText');
}

fixTableHeaders = function() {
    $("th.sorting").each( function() {
        $(this).attr("aria-description", "Activate to sort");
        $(this).removeAttr("aria-label");
    });
}


function applyAccessibilityOverrides() {

    // add more descriptive labels to the form elements with implicit labels
    addDescriptiveLabels();

}

$(".modalButton").click(function() {
    // find the modal body
    var modalList = $("#edit-tool-properties").find(".modal-list");

    // clear the ul, in case a cancel button happened
    $(modalList).empty();

    // loop through all the non-header checked check boxes (class checkbox)
    $('input.dt-select-checkbox:checked:not(.header-checkbox)').each(function(index) {
        var displayName = $(this).closest('tr').find('.displayName').text();
        var username = $(this).closest('tr').find('.username').text();
        var dupeBonus = "";
        var isDupe = ($(this).closest('tr').attr('data-is-dupe') === 'true');
        if (isDupe) {
            separator = " - ";
            var role = $(this).closest('tr').find('.role').text();
            var section = $(this).closest('tr').find('.section').text();
            dupeBonus = " - " + role + " (" + section + ")";
        }
        $(modalList).append("<li>" + displayName + " (" + username + ")" + dupeBonus + "</li>")
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

    // Some browsers need this to have submissions work correctly
    $('#bulk-remove-users-form').submit();
});

var table = $('#appTable').DataTable({
   dom: 'Pfrtip',
   orderCellsTop: true,
   paging: false,
   order: [[1, 'asc']],
   columnDefs: [
        {
            targets: [0],
            orderable: false,
            searchPanes: { show: false },
            // The .8 and .7 are the column indexes containing the data that will be used for the checkbox value and name
            render: DataTable.render.select('.8', '.7')
        },
        {
            targets: [7, 8],
            visible: false,
            searchable: false
        }
       ],
   language: {
           aria: {
               orderableReverse: '',
               orderable: '',
               orderableRemove: '',

           }
       },
   initComplete: function () {
       $('#appTable').wrap("<div style='overflow:auto;width:100%;position:relative;'></div>");
//       labelCheckboxes();
   },
   select: {
        selector: 'th:first-child',
        style: 'multi',
        info: false
   },
   searchPanes: {
       columns: [3, 4],
       viewTotal: true,
       filterChanged: function (count) {
           // Update selected counts following filter changes
           userSelectedCounter();
       }
   }
});

$('thead input[type=checkbox]').addClass('header-checkbox');

table.on('select deselect user-select', function () {
    // Update selected counts after (de)selections
    userSelectedCounter();
});
