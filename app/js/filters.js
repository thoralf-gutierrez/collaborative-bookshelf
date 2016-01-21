
angular.module('CollaborativeBookshelfApp.filters',[]).

filter('bookFilter', function() {
return function (books, switches) {
		
		var items = {
            switches: switches,
            out: []
        };
		
		angular.forEach(books, function (value, key) {
			if (switches.available && switches.borrowed)
        		this.out.push(value);
        	else if (switches.available && value.borrowed_by === undefined)
        		this.out.push(value);
        	else if (switches.borrowed && value.borrowed_by !== undefined)
        		this.out.push(value);
        }, items);

        return items.out;
    };
  });
