let markerList = {};

$(document).ready(function () {
    
    mapboxgl.accessToken = "pk.eyJ1IjoibnBhcmFqdWwiLCJhIjoiY2szODMwb21qMDNyazNjczJlY3R3YWk1ayJ9.1iCRExy16Br5uP6O5cekAw";

    $('#updateForm').hide();

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [-74.003807, 40.753250],
        zoom: 7
    });

    addMarkers();

    $(".clickable").on("click", "tr", function () {

        var lat = $(this).data("lat");
        var lng = $(this).data("lng");
  
        map.flyTo({
            center: [lng, lat]
        });
    })

    $(".clickable-row").on("click", "#updateButton", function () {

        $("#container").hide();
        $("#map").hide();
        $('form').show();

        var prefix = $(this).data("prefix");
        console.log("Prefix is "+ prefix);
        var firstName = $(this).data("firstname");
        var lastName = $(this).data("lastname");
        var street = $(this).data("street");
        var city = $(this).data("city");
        var state = $(this).data("state");
        var zip = $(this).data("zip");
        var email = $(this).data("email");
        var phone = $(this).data("phone");
        var contactbymail = $(this).data("contactbymail");
        var contactbyemail = $(this).data("contactbyemail");
        var contactbyphone = $(this).data("contactbyphone");

        console.log("Mail "+contactbymail);
        console.log("Email "+contactbyemail);
        console.log("Phone "+contactbyphone);

        if (prefix == "Mr.") {

            $("#radio1").prop("checked", true);
        }
        else if (prefix == "Mrs.") {
            $("#radio2").prop("checked", true);
        }
        else if (prefix == "Ms.") {
            $("#radio3").prop("checked", true);
        }
        else {
            $("#radio4").prop("checked", true);
        }

        if (contactbymail!= "No" && contactbyemail!= "No" && contactbyphone!= "No"){
            console.log("All");
            $("#allcheck").prop('checked', true);
        }
        else 
        {
            
            if (contactbymail != "No"){
                console.log("Mail");
                $("#mailcheck").prop('checked', true);
            }
            if (contactbyemail != "No"){
                console.log("Email");
                $("#emailcheck").prop('checked', true);
            }
            if (contactbyphone != "No"){
                console.log("Phone");
                $("#phonecheck").prop('checked', true);
            }
        }

        $("#first").val(firstName);
        $("#first").attr('data-id', $(this).data("id"));
        $("#custId").val($(this).data("id"));
        $("#last").val(lastName);
        $("#inputAddress").val(street);
        $("#inputCity").val(city);
        $("#inputState").val(state).attr("selected", "selected");
        $("#inputZip").val(zip);
        $("#inputPhone").val(phone);
        $("#inputEmail").val(email);
        

    })

    $(".clickable-row").on("click", "#deleteButton", function () {

        var id = { contactId: $(this).data('id') };
        var lat = $(this).parent().parent().data('lat');
        var lng = $(this).parent().parent().data('lng');
        // console.log("Lat is  " + lat);
        // console.log("Lng is  " + lng);

        $(this).parent().parent().remove();
        var email = $(this).parent().parent().data('email');
        let markerTodelete = markerList[email];
        markerTodelete.remove();
        $.ajax({
            type: 'POST',
            data: JSON.stringify(id),
            contentType: 'application/json',
            url: 'http://localhost:3000/delete',
            success: function (data) {
                console.log("Contact Deleted ");

            },
            error: function (err) {
                console.log("ERROR!")
            }
        });
    });

    $("#searchTable").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#tableBody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

    function addMarkers() {
        $('table > tbody > tr').each(function () {
            var name =$(this).data("name");
            var address =$(this).data("address");
            var lat = $(this).data("lat");
            var lng = $(this).data("lng");
    
            console.log("Lat is " + lat);
            console.log("Lng is " + lng);
    
            var description = name +  " " + address;
            var popup = new mapboxgl.Popup({ offset: 25 }).setText(description);
            var marker = new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);
            const email = $(this).data('email');
            markerList[email] = marker;

        });
    }
});