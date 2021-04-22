const venom = require('venom-bot');
const prompt = require('prompt-sync')();
fs = require('fs');

venom
    .create('ubiklan2')
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    })

function type_message(message, cust_name = "", order_id = "", other = "") {
    if (cust_name !== "") {
        message = message.replace('__cust_name__', cust_name);
    }

    if (order_id !== "") {
        message = message.replace('__order_id__', order_id);
    }

    if (other !== "") {
        message = message.replace('__other__', other);
    }

    return message;
}

function write_error(text, phone){
    error_text = "Failed to send message to : " + phone;
    error_text += "\nBecause "+text+"\n"
    console.log(error_text);
    // fs.writeFile('error_log.txt', error_text, function (err) {
    //     if (err) return console.log(err);
    // });
}

function ask_phone_number(){
	let phone_number_file = prompt('Phone Number List Filename (default_phone_number.txt): ');
    let phone_number = '';
    if (phone_number_file == '') {
        phone_number = fs.readFileSync('default_phone_number.txt', 'utf8');
    } else {
        phone_number = fs.readFileSync(phone_number_file + '.txt', 'utf8');
    }

    return phone_number.replace(/(\r\n|\n|\r)/gm, "");
}

function extract_phone_number(data, type = 1) {
    let returned_data = {};
    returned_data.phone_numbers = [];
    returned_data.customer_names = [];
    returned_data.order_ids = [];
    returned_data.others = [];
    if (type > 1) {
        data = data.split(",")
        for (i = 0; i < data.length; i++) {
            text = data[i].split('-');
            returned_data.phone_numbers.push(text[0]);
            if (typeof text[1] !== 'undefined') {
                returned_data.customer_names.push(text[1]);
            }
            if (typeof text[2] !== 'undefined') {
                returned_data.order_ids.push(text[2]);
            }
            if (typeof text[3] !== 'undefined') {
                returned_data.others.push(text[3]);
            }
        }
    } else {
        returned_data.phone_numbers = data.split(",");
    }

    return returned_data;
}

function logout(client) {
    // Logout the client
    client.logout();
}

function start(client) {
    let last_phone_number = "";
    let phone_numbers = [];
    let customer_names = [];
    let order_ids = [];
    let others = [];
    const prefix = "@c.us";
    const message_type = prompt('(1) Text Message (2) With Image. Select Message Type(1/2): ');
    if(message_type == 1){
    	const type = prompt('(1) Plain Text (2) With Greetings (3) Greetings With OrderId (4) With Other Text. Select Type(1/2/3/4): ');
	    let phone_number = ask_phone_number();
	    let returned_data = extract_phone_number(phone_number, type);
	    customer_names = returned_data.customer_names;
	    order_ids = returned_data.order_ids;
	    others = returned_data.others;
	    phone_numbers = returned_data.phone_numbers;
	    let message_file = prompt('Message Filename (default_message.txt): ');
	    let message = '';
	    if (message_file == '') {
	        message = fs.readFileSync('default_message.txt', 'utf8');
	    } else {
	        message = fs.readFileSync(message_file + '.txt', 'utf8');
	    }
	    for (i = 0; i < phone_numbers.length; i++) {
	        if (phone_numbers[i].startsWith(0)) {
	            phone_numbers[i] = phone_numbers[i].replace("0", "62");
	        }
	        if (type == 2) {
	            message_to_send = type_message(message, customer_names[i]);
	        } else if (type == 3) {
	            message_to_send = type_message(message, customer_names[i], order_ids[i]);
	        } else if (type == 4) {
	            message_to_send = type_message(message, customer_names[i], order_ids[i], others[i]);
	        } else {
	            message_to_send = type_message(message);
	        }

	        client.sendText(phone_numbers[i].concat(prefix), message_to_send)
	            .catch(
	                (errno) => {
                        write_error(JSON.stringify(errno.text), JSON.stringify(errno.to).replace("@c.us", ""));
                    }
	            )
	    }
    }else{
		let phone_number = ask_phone_number();
	    let image_file = prompt('Image File (image_message.jpeg): ');
	    if(image_file == ''){
	    	image = 'image_message.jpeg';
	    }else{
	    	image = image_file;
	    }
		let message_to_send = fs.readFileSync('image_caption_message.txt', 'utf8');
        let returned_data = extract_phone_number(phone_number, 1);
        phone_numbers = returned_data.phone_numbers;
		for (i = 0; i < phone_numbers.length; i++) {
	        if (phone_numbers[i].startsWith(0)) {
	            phone_numbers[i] = phone_numbers[i].replace("0", "62");
	        }

		    client.sendImage(phone_numbers[i].concat(prefix), image, 'Image File', message_to_send)
	        .catch(
	            (errno) => {
                    write_error(JSON.stringify(errno.text), JSON.stringify(errno.to).replace("@c.us", ""));
                }
	        )
	    }
    }

    is_repeat = prompt("\nSend Another Message(y/n)? ");
    if (is_repeat == 'y') {
        start(client);
    } else {
        console.log('bye!\nPress (Ctrl+C) to exit!');
    }
}