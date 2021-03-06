/*
 * helpers
 */

var throws = function(block, description){
  var didThrow = false;
  try{
    block();
  } catch (error) {
    didThrow = true;
  }
  ok(didThrow, description);
};


/*
 * basics
 */

module("basics");

test('errors on unknown commands', function(){
  var node = $('<div react="nonexistentcommand arg1"></div>')[0];
  throws(function(){
    react.update(node, {});
  }, 'throws at nonexistantcommand');
});

test('keys can use dot operator', function(){
  var node = $('<div react="contain key.subkey"/>')[0];
  react.update(node, {key:{subkey:'content'}});
  equal($(node).html(), 'content', 'key resolved while using a dot operator');
});

test('calling update returns the root', function(){
  var node = $('<div id="foo"></div>')[0];
  equal(react.update(node, {}), node, 'same node was returned');
});

test('rendering to nodes that are nested in others still works', function(){
  var $parent = $('<div></div>');
  var $child = $('<div react="contain foo"></div>');
  $parent.html($child);
  react.update($child[0], {foo:'bar'});
  equal($child.html(), 'bar', 'the child node got the appropriate content');
});

test('rendering to nodes that are nested in others still works, an additional layer deep', function(){
  var $parent = $('<div></div>');
  var $child = $('<div><div react="contain foo"></div></div>');
  $parent.html($child);
  react.update($child[0], {foo:'bar'});
  equal($child.children().first().html(), 'bar', 'the child node got the appropriate content');
});

/*
 *  containing
 */

module("contain");

test('containing strings', function(){
  var node = $('<div react="contain \'example\'"></div>')[0];
  react.update(node, {});
  equal(node.innerHTML, 'example', 'contain directive inserted a string');
});

test('containing variables', function(){
  var node = $('<div react="contain key"></div>')[0];
  react.update(node, {key:'value'});
  equal(node.innerHTML, 'value', 'contain directive inserted a string variable');
});

test('containing node variables', function(){
  var node = $('<div react="contain child"></div>')[0];
  var child = $('<div/>')[0];
  react.update(node, {child:child});
  equal($(node).children()[0], child, 'contain directive inserted a node variable');
});

test('containing react nodes', function(){
  var node = $('<div react="contain child"></div>')[0];
  var child = $('<div react="contain foo"></div>')[0];
  react.update(node, {child:child, foo:'bar'});
  equal($(node).children().html(), 'bar', 'react directive of contained node was followed');
});


/*
 * attributes
 */

module("attributes");

test('setting string attributes', function(){
  var node = $('<div react="attr \'foo\' \'bar\'"/>')[0];
  react.update(node, {});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('substituting variables in attribute names', function(){
  var node = $('<div react="attr attrName \'bar\'"/>')[0];
  react.update(node, {attrName:'foo'});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('substituting variables in attribute values', function(){
  var node = $('<div react="attr \'foo\' value"/>')[0];
  react.update(node, {value:'bar'});
  equal($(node).attr('foo'), 'bar', 'attribute was written correctly');
});

test('conditionally adding attributes', function(){
  var node = $('<div react="attrIf condition \'foo\' \'bar\'"/>')[0];

  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was added when condition is true');

  react.update(node, {condition:false});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is false');

  react.update(node, {condition:undefined});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is undefined');

  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was re-added when condition is true');
});


/*
 *  conditionals
 */

module("conditionals");

test('conditional display', function(){
  var node = $('<div react="showIf key"></div>')[0];
  react.update(node, {key:false});
  equal($(node).css('display'), 'none', 'node is hidden when key is false');
  react.update(node, {key:true});
  equal($(node).css('display') || 'block' /*chrome returns an empty string for default display value*/, 'block', 'node is shown again when key is changed to true');
});

test('conditional visibility', function(){
  var node = $('<div react="visIf key"></div>')[0];
  react.update(node, {key:false});
  equal($(node).css('visibility'), 'hidden', 'node is invisible when key is false');
  react.update(node, {key:true});
  equal($(node).css('visibility'), 'visible', 'node is visible again when key is changed to true');
});

test('conditional classes', function(){
  var node = $('<div class="bar" react="classIf condition \'foo\'"/>')[0];
  ok($(node).hasClass('bar'), 'node starts out with a bar class');
  react.update(node, {condition:false});
  ok(!$(node).hasClass('foo'), 'class was not added when condition is false');
  ok($(node).hasClass('bar'), 'bar class was not removed');
  react.update(node, {condition:true});
  ok($(node).hasClass('foo'), 'class was added when condition is false');
  ok($(node).hasClass('bar'), 'bar class was not removed');
  react.update(node, {});
  ok(!$(node).hasClass('foo'), 'class was removed when condition is undefined');
  ok($(node).hasClass('bar'), 'bar class was not removed');
});

test('conditional attributes', function(){
  var node = $('<div react="attrIf condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), undefined, 'attribute was not added when condition is false');
  react.update(node, {condition:true});
  equal($(node).attr('foo'), 'bar', 'attribute was added when condition is true');
});

test('conditions can be negated', function(){
  var node = $('<div react="attrIf !condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), 'bar', 'attribute was added when negated condition is false');

  node = $('<div react="attrIf ! condition \'foo\' \'bar\'"/>')[0];
  react.update(node, {condition:false});
  equal($(node).attr('foo'), 'bar', 'with a space, attribute was added when negated condition is false');
});

test('if directives turn off recursion in subsequent directives of the same node', function(){
  var node = $('<div react="if condition \'foo\', contain bar">original</div>')[0];
  react.update(node, {condition: true, bar: 'new'});
  equal($(node).html(), 'new', 'contents get set when condition is false');

  var scope = {condition:false, bar:'newer'};
  react.update(node, scope, {anchor: true});
  equal($(node).html(), 'new', 'contents went unchanged when condition is false');

  react.set(scope, 'condition', true);
  equal($(node).html(), 'newer', 'contents changed when property was updated to true');
});

test('if directives turn off recursion in child nodes', function(){
  var node = $('<div react="if condition \'foo\'">\
    <div react="contain bar">original</div>\
  ')[0];
  react.update(node, {condition: true, bar: 'new'});
  equal($(node).children().first().html(), 'new', 'contents get set when condition is false');

  var scope = {condition:false, bar:'newer'};
  react.update(node, scope, {anchor: true});
  equal($(node).children().first().html(), 'new', 'contents went unchanged when condition is false');

  react.set(scope, 'condition', true);
  equal($(node).children().first().html(), 'newer', 'contents changed when property was updated to true');
});


/*
 * withinEach
 */

module("withinEach");

test('works with a missing key alias', function(){/*...*/});

test('requires at least an item template node and a contents node inside the loop node', function(){
  throws(function(){
    react.update($('<div react="for item">\
      <span class="exampleTemplate"></span>\
      <!-- to prevent debeloper surprise, the missing container tag here is required -->\
    </div>')[0], []);
  }, 'omitting second loop child is not allowed');
});

test('template node is not visible after render', function(){
  var node = $('\
    <div id="outter" react="for which item">\
      <div react="contain item"></div>\
    <div id="container"></div></div>\
  ')[0];
  var $itemTemplate = $(node).children().first();
  $itemTemplate.is(':visible');
  react.update(node, ['a','b','c']);
  $itemTemplate.is(':not(:visible)');
});

test('can loop across values in an array', function(){
  var node = $('\
    <div id="outter" react="for which item">\
      <div id="item" react="contain item"></div>\
    <div id="container"></div></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a','b','c']);
  equal($(node).children().last().children().length, 3, 'results container node contains three child elements');
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['a','b','c'], 'children\'s innerHTML is set to array items\' contents');
});

test('does not operate on loop item template node', function(){
  var node = $('\
    <div id="outter" react="for which item">\
      <div id="item" react="contain item">stuff</div>\
    <div id="container"></div></div>\
  ')[0];
  var itemTemplate = $(node).children()[0];
  react.update(node, ['a','b','c']);
  equal($(itemTemplate).html(), 'stuff', 'item template was unchanged');
});

test('does not operate on descendants of loop item template node', function(){
  var node = $('\
    <div id="outter" react="for which item">\
      <div id="item"><div id="descendant" react="contain item">stuff</div></div>\
    <div id="container"></div></div>\
  ')[0];
  var itemTemplate = $(node).children()[0];
  react.update(node, ['a','b','c']);
  equal($(itemTemplate).find('#descendant').html(), 'stuff', 'item template was unchanged');
});

test('does not operate on descendants of loop item template node, even when loop item template has no react attribute', function(){
  react.update($('\
    <div react="for val">\
      <li><a react="attr \'href\' val"></a></li>\
    <ul></ul></div>\
  ')[0], ['foo']);
});

test('calling changed on a subobject that\'s associated with a within directive does not attempt to rerender all directives on the node', function(){
  var node = $('<div react="attr \'thing\' outterProp, within subobject, within innerProp, contain val"></div>')[0];
  var scope = {
    outterProp: 'outter',
    subobject: {
      innerProp: {val:'inner'}
    }
  };
  react.update({
    node: node,
    scope: scope,
    anchor: true
  });
  same($(node).attr('thing'), 'outter', 'attr came from outter prop');
  same(node.innerHTML, 'inner', 'contents came from inner prop');
  scope.outterProp = 'newOutter';
  scope.subobject.innerProp = {val:'newInner'};
  react.changed(scope.subobject, 'innerProp');
  same($(node).attr('thing'), 'outter', 'attr was not changed');
  same(node.innerHTML, 'newInner', 'contents got updated');
});

test('can loop across keys in an array', function(){
  var node = $('\
    <div react="for which item">\
      <div react="contain which"></div>\
    <div></div></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a','b','c']);
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['0','1','2'], 'children\'s innerHTML is set to array key\'s contents');
});

test('functions bound at loop time evaluate in correct context', function(){
  var node = $('\
    <div react="for which item">\
      <div react="contain item"></div>\
    <div></div></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a', function(){return this[2];}, 'b']);
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['a','b','b'], 'children\'s innerHTML is set to array key\'s contents');
});

test('results are put in second dom node', function(){
  var node = $('<div react="for which item">\
    <div react="contain item"></div>\
    <div id="intended_destination"></div>\
    <div id="decoy"></div>\
  </div>')[0];
  var resultsHolder = $(node).find('#intended_destination');
  react.update(node, ['a']);
  same($($(resultsHolder).children()[0]).html(), 'a', 'child\'s innerHTML is set to array elemnt\'s value');
});

test('originally rendered nodes are preserved on rerender', function(){
  var node = $('\
    <div react="for which item">\
      <div react="contain item"></div>\
    <span></span></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, ['a', 'b', 'c']);
  var originalChildren = $(resultsHolder).children();
  react.update(node, ['d', 'e', 'f']);
  var updatedChildren = $(resultsHolder).children();
  for(var i = 0; i < 3; i++){
    equal(originalChildren[i], updatedChildren[i], 'dom node '+i+' was reused');
  }
});

test('loops can be changed()', function(){
  var node = $('<div react="for which item">\
    <div react="contain item"></div>\
  <span class="resultsHolder"></span></div>')[0];

  var testItems = function(node, data){
    var resultsHolder = $(node).children()[1];
    var children =  $(resultsHolder).children();
    for(var i = 0; i < data.length; i++){
      equal($(children[i]).html(), data[i], 'dom node '+i+' contains expected value');
    }
    equal(children.length, data.length, 'list item length is the same as dom node count');
  };

  var data = ['a', 'b'];
  react.anchor( node, data );
  react.update( node );
  testItems(node, data);
  data.push('c');
  react.changed(data);
  testItems(node, data);
  data.pop();
  data.pop();
  react.changed(data);
  testItems(node, data);
});


/*
 * withinEach
 */

module("withinEach");

test('looping several times on different sized arrays results in different amounts of result contents nodes', function(){
  var node = $('\
    <div react="withinEach">\
      <div react="contain foo"></div>\
    <span></span></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, [{foo:'a'}, {foo:'b'}, {foo:'c'}]);
  same($(resultsHolder).children().length, 3, '3 children for inital render');
  react.update(node, [{foo:'a'}, {foo:'b'}]);
  same($(resultsHolder).children().length, 2, '2 children for inital render');
  react.update(node, [{foo:'a'}, {foo:'b'}, {foo:'c'}, {foo:'d'}]);
  same($(resultsHolder).children().length, 4, '4 children for inital render');
});

test('withinEach implies a within statement on item nodes', function(){
  var node = $('\
    <div react="withinEach">\
      <div react="contain foo"></div>\
    <span></span></div>\
  ')[0];
  var resultsHolder = $(node).children()[1];
  react.update(node, [{foo:'a'}, {foo:'b'}, {foo:'c'}]);
  same([
    $($(resultsHolder).children()[0]).html(),
    $($(resultsHolder).children()[1]).html(),
    $($(resultsHolder).children()[2]).html()
  ], ['a','b','c'], 'children took their values from item objects\' foo properties');
});

test('nested withinEachs', function(){
  var $node = $('\
    <div react="withinEach">\
      <div react="withinEach">\
        <div react="contain foo"></div>\
      <span></span></div>\
    <span></span></div>\
  ');
  react.update($node[0], [[{foo:'a'}]]);
  var $outterResultsHolder = $node.children().last();
  var $innerLoop = $outterResultsHolder.children().first();
  var $innerResultsHolder = $innerLoop.children().last();
  same($innerResultsHolder.children().first().html(), 'a', 'doubly nested children took their values from item objects\' foo properties');
});

/*
 * within
 */

module("within");

test('scope can be shifted within a property', function(){
  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {key: 'content'}, key:'wrongContent'});
  equal($(node).html(), 'content', 'content was correct from within a subobject');

  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {}, key:'content'});
  equal($(node).html(), 'content', 'key fell through fell through to next higher scope when local key is missing');

  var node = $('<div react="within subobject, contain key"/>')[0];
  react.update(node, {subobject: {key: undefined}, key:'content'});
  equal($(node).html(), 'content', 'key fell through fell through to next higher scope when local key is undefined');
});


/*
 * function properties
 */

test('functions get evaluated', function(){
  var node = $('<div react="contain foo"></div>')[0];
  react.update(node, {
    foo:function(){
      return 'bar';
    }
  });
  same(node.innerHTML, 'bar', 'function result was inserted');
});

test('functions evaluate in correct context', function(){
  var node = $('<div react="contain foo"></div>')[0];
  react.update(node, {
    bar: 'right',
    foo:function(){
      return this.bar;
    }
  });
  same(node.innerHTML, 'right', 'function evaluated with the correct this object');
});

test('functions can be dot accessed', function(){
  var node = $('<div react="contain foo.bar"></div>')[0];
  var didRun = false;
  var object = {
    foo: function(){
      didRun = true;
      return 'wrong';
    }
  };
  object.foo.bar = function(){
    return 'right';
  };
  react.update(node, object);
  ok(!didRun, 'namespacing functions are not run');
  same(node.innerHTML, 'right', 'function result was inserted');
});


/*
 * anchor
 */

module('anchor');

test('can name objects', function(){
  var obj = {};
  react.name('foo', obj);
  equal(react.scopes.foo, obj, 'react.scopes held the specified object at the specified name');
});

test('anchored nodes are prepended to scope chains on render', function(){
  var outter = $('<div react="anchored obj"></div>')[0];
  var inner = $('<div react="contain foo"></div>')[0];
  $(outter).html(inner);
  react.name('obj', {foo:'bar'});
  react.update(outter, {});
  equal($(inner).html(), 'bar', 'inner node had access to outter node\'s anchor object');
});

// todo: test support for anchoring to whole scope chains

test('anchored nodes re-render on object change', function(){
  var object = {foo:1, bar:1};
  var node1 = $('<div react="contain foo"></div>')[0];
  var node2 = $('<div react="contain bar"></div>')[0];
  react.anchor(node1, object);
  react.update(node1);
  react.anchor(node2, object);
  react.update(node2);
  object.foo = object.bar = 2;
  react.changed(object);
  same([node1.innerHTML, node2.innerHTML], ['2','2'], 'anchored nodes were updated when relevant object was changed');
});

test('changing values on an anchored object results in automatic change to the view', function(){
  var object = {foo:'bar'};
  var node = $('<div react="classIf foo foo"></div>')[0];
  react.update({node: node, scope: object, anchor: true});
  ok($(node).hasClass('bar'), 'node got correct first class');
  react.set(object, 'foo', 'baz');
  ok(!$(node).hasClass('foo'), 'node does not have first class anymore');
  ok($(node).hasClass('baz'), 'node got correct second class');
});

test('calling changed on anchored objects doesn\'t re-render properties on anchored nodes that are listening to other scopes', function(){
  var o1 = {foo:true}, o2 = {bar:true};
  var node = $('<div react="classIf foo \'foo\', classIf bar \'bar\'"></div>')[0];
  react.update({node: node, scopes: [o1,o2], anchor: true});
  same([$(node).hasClass('foo'), $(node).hasClass('bar')], [true, true], 'anchored nodes were initialized correctly');
  o1.foo = o2.bar = false;
  react.changed(o1);
  same([$(node).hasClass('foo'), $(node).hasClass('bar')], [false, true], 'anchored nodes were updated when relevant object was changed, but not for properties on objects not notified of change');
});

test('updating anchored nodes does not revisit all nodes', function(){
  var object = {foo:1, bar:1};
  var node = $('<div react="attr \'foo\' foo, attr \'bar\' bar"></div>')[0];
  react.update({node: node, scope: object, anchor: true});
  same($(node).attr('foo'), '1', 'foo starts out at 1');
  same($(node).attr('bar'), '1', 'bar starts out at 1');
  object.bar = 2;
  react.set(object, 'foo', 2);
  same($(node).attr('foo'), '2', 'for anchored nodes, properties that are set using react.set() get autmatically updated');
  same($(node).attr('bar'), '1', 'properties changed manually are not rerendered');
});


/*
 * changed
 */

test('calling changed on an array updates associated list items', function(){
  var object = ['foo'];
  var node = $('\
    <div react="for which item">\
      <div class="item" react="contain item"></div>\
    <span id="container"></span></div>\
  ')[0];
  react.update({node: node, scope: object, anchor: true});
  same($('#container .item', node).first().html(), 'foo', 'item substitution starts out as foo');
  react.set(object, 0, 'baz');
  same($('#container .item', node).first().html(), 'baz', 'item substitution got changed');
});

test('regression test: index key binding is still available at change response time', function(){
  var object = [{}, {}];
  var node = $('<div react="for which item">\
      <div class="item" react="within item, contain which"></div>\
  <span id="container"></span></div>')[0];
  react.update({node: node, scope: object, anchor: true});
  same($($('#container .item', node)[1]).html(), '1', 'which is available after an update operation');
  react.set(object, 1, {});
  same($($('#container .item', node)[1]).html(), '1', 'which is still available after a change response');
});

test('', function(){
// todo: write a test this for inadvertent fallthrough, for the case where lookup of a withinItem key hits undefined and falls through this._lookupInScopeChain(args[0], lastLink)
});

test('regression test: a withinEach inside a for will not get duplicate bindings', function(){
  var object = [[{prop:'a'}, {prop:'b'}]];
  var node = $('\
    <div react="for which item">\
      <div class="item" react="within item, withinEach">\
        <span class="innerTemplate" react="contain which"></span>\
        <span class="innerContainer"></span>\
      </div>\
    <span id="container"></span></div>\
  ')[0];
  react.update({node: node, scope: object, anchor: true});
  same($($('#container .innerContainer .innerTemplate', node)[1]).html(), '0', 'there is only one element in the outter array, so index substitution (binding to the key "which") should always be 0');
  react.set(object, 0, [{prop:'c'}, {prop:'d'}]);
  // before the bug fix, the binding instruction from the outter 'for' directive never got blown away as the scope chain got built up
  // thus, there would have been an extra key binding scope, instead of the normal withinEach style scope change into a property
  same($($('#container .innerContainer .innerTemplate', node)[1]).html(), '0', 'index substitution is still set to 0');
  react.set(object, 0, [{which:'foo'}, {which:'bar'}]);
  same($($('#container .innerContainer .innerTemplate', node)[1]).html(), 'bar', 'index substitution changes to the masking property');
});

test('when a list item is removed, associated loop item nodes disappear', function(){
/* todo
  var object = ['a', 'b'];
  var node = $('\
    <div react="for which item">\
      <span class="item" react="contain item"></span>\
    <span id="container"></span></div>\
  ')[0];
  react.update({node: node, scope: object, anchor: true});
  same($($('#container .item', node)[1]).html(), 'b', 'second item got set');
  object.slice(0,1);
  react.changed(object, 1);
  // before the bug fix, the binding instruction from the outter 'for' directive never got blown away as the scope chain got built up
  // thus, there would have been an extra key binding scope, instead of the normal withinEach style scope change into a property
  same($('#container .item', node).length, 1, 'redundant node got deleted');
*/
});

test('increasing the length property of a list appends extra nodes', function(){
});

test('reducing the length property of a list deletes extra nodes', function(){

});

test('lookups to loop items don\'t fall through past the top scope if that item holds undefined', function(){
  // not yet tested
});

test('don\'t allow looping within non-enumerable (or non-observable) objects', function(){
//  ok(false, 'not yet written');
});

test('recomputes all subnodes when changing the value stored at some index of an observed array that was looped over', function(){
//  ok(false, 'not yet written');
});

///*
test('loop items get bound to their indices', function(){
  var object = ['a', 'b'];
  var node = $('\
    <div react="for which item">\
      <div class="item" react="contain item"></div>\
    <span id="container"></span></div>\
  ')[0];
  react.update({node: node, scope: object, anchor: true});
  same($($('#container .item', node)[1]).html(), 'b', 'substitution starts out as b');
  react.set(object, 1, 'bPrime');
  same($($('#container .item', node)[1]).html(), 'bPrime', 'substitution gets set to b prime');
});
//*/

test('event handlers don\'t dissapear on call to changed()', function(){
  var subNode = $('<div><div id="clicker">increment</div></div>')[0];
  var object  = {foo:1, 'subNode':subNode};
  jQuery( '#clicker', subNode).bind('click', function(){
    object.foo += 1;
    react.changed(object);
  });

  var node = $('<div>\
    <div id="foo" react="contain foo"></div>\
    <div react="contain subNode"></div>\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});
  same(jQuery( '#foo', node)[0].innerHTML, '1', 'foo got set');
  $('#clicker', subNode).trigger( 'click' );
  same(jQuery( '#foo', node).html(), '2', 'foo got updated');
  $('#clicker', subNode).trigger( 'click' );
  same(jQuery( '#foo', node).html(), '3', 'foo got updated after changed');
});

test('can anchor in update operation with three arguments', function(){
  var object = {foo:'bar'};
  var node = react.update($('<div react="contain foo"></div>')[0], object, {anchor: true});
  object.foo = 'baz';
  react.update(node);
  same(node.innerHTML, 'baz', 'node got the new value from the anchored object');
});

test('event handlers don\'t get lost by loop insertion', function(){
  var wasClicked;
  var insertion = $('<div></div>').click(function(){
    wasClicked = true;
  })[0];
  var node = react.update($('<div react="for item">\
    <div react="contain item"></div>\
    <div></div>\
  </div>')[0], [insertion]);

  $(insertion).click();
  ok(wasClicked, 'click was noticed, even though node was inserted by a looping construct');
});

test('event handlers don\'t get lost by loop item creation', function(){
  var wasClicked;
  var insertion = $('<div class="insertion"></div>').click(function(){
    wasClicked = true;
  })[0];
  var insertions = [insertion];
  var node = react.update($('<div react="for item">\
    <div react="contain item"></div>\
    <div></div>\
  </div>')[0], insertions, {anchor: true});

  $(node).find('.insertion').click();
  ok(wasClicked, 'click was noticed, even though node was inserted by a looping construct');
  insertions.push($(insertion).clone()[0]);
  wasClicked = false;

  react.changed(insertions);
  $(node).find('.insertion').click();
  ok(wasClicked, 'click was noticed after list changed and contents of loop results node were updated');
});

test('anchors are followed even for child nodes of the input node', function(){
  var subNode = $('<span react="contain foo"></span>')[0];
  react.anchor(subNode, {foo: 'bar'});
  react.update($('<span react="contain subNode"></span>')[0], {subNode: subNode});
  same(subNode.innerHTML, 'bar', 'foo did not get updated');
});

test('anchored nodes within root get operated on, even if root does not', function(){
  var subNode = $('<span react="contain foo"></span>')[0];
  react.anchor(subNode, {foo: 'bar'});
  react.update($('<div></div>').html(subNode)[0]);
  same(subNode.innerHTML, 'bar', 'foo did not get updated');
});

test('unanchored nodes can have properties set with no side effects', function(){
  var object = {foo:1, bar:1};
  var node = $('<div>\
    <div react="contain foo"></div>\
    <div react="contain bar"></div>\
  </div>')[0];
  react.update(node, object);
  object.bar = 2;
  react.set(object, 'foo', 2);
  same($(node).children()[0].innerHTML, '1', 'for unanchored nodes, properties that are set using react.set() are not updated');
  same($(node).children()[1].innerHTML, '1', 'properties changed manually are alos not rerendered');
});

test('updating anchored nodes does not revisit all nodes', function(){
  var object = {foo:1, bar:{
    baz: 1
  }};
  var node = $('<div>\
    <div react="contain foo"></div>\
    <div react="within bar">\
      <div react="contain baz"></div>\
    </div>\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});
  react.set(object.bar, 'baz', 2);
  same($(node).children().last().children().first().html(), '2', 'when properties within properties get changed, their corresponding nodes are changed as well');
});

test('changing object strucutre invalidates change propogation to the view', function(){
  var object = {
    foo: {
      bar: 1
    }
  };
  var node = $('<div react="within foo">\
    <div react="contain bar"></div>\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});
  var foo = object.foo;
  object.foo = { bar: 'wrong' };
  react.set(foo, 'bar', 'alsowrong');
  same($(node).children().first().html(), '1', 'the property linked to the replaced object was not re-rendered');
  object.foo = foo;
  react.set(foo, 'bar', 'right');
  same($(node).children().first().html(), 'right', 'the property linked to the replaced object was re-rendered after the object was put back');
});

test('changing dom strucutre invalidates change propogation to the view', function(){
  var object = {
    foo: {
      bar: 1
    }
  };
  var node = $('<div react="within foo">\
    <div react="contain bar"></div>\
  </div>')[0];
  var $child = $(node).children();
  react.update({node: node, scope: object, anchor: true});
  $(node).html('');
  react.set(object.foo, 'bar', 2);
  same($child.html(), '1', 'the property linked to the replaced object was not re-rendered');
  $(node).html($child);
  react.set(object.foo, 'bar', 3);
  same($child.html(), '3', 'the property linked to the replaced object was re-rendered after the object was put back');
});


/*
 * changed
 *
 */

test('within directive works well with changed method', function(){
  var object = {
    first: 1,
    subobject:{
      second: 2
    },
    third: 3
  };
  var node = $('<div>\
    <div id="foo" react="contain first"></div>\
    <div react="within subobject">\
      <div id="bar" react="contain second"></div>\
    </div>\
    <div id="baz" react="contain third">\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});
  same($( '#foo', node)[0].innerHTML, '1', 'foo gets set');
  same($( '#bar', node)[0].innerHTML, '2', 'baz gets set');
  same($( '#baz', node)[0].innerHTML, '3', 'bang gets set');

  object.first = 4;
  object.second = 5;
  object.third = 6;
  react.changed(object);
  same($( '#foo', node)[0].innerHTML, '4', 'foo goes higher');
  same($( '#bar', node)[0].innerHTML, '2', 'bar stays the same because it\'s looking within .subobject');
  same($( '#baz', node)[0].innerHTML, '6', 'baz goes higher');

  object.subobject.second = 1000;
  react.changed(object);
  same($( '#foo', node)[0].innerHTML, '4', 'foo remains higher');
  same($( '#bar', node)[0].innerHTML, '1000', 'bar gets really high');
  same($( '#baz', node)[0].innerHTML, '6', 'baz remains higher');
});

test('regression test - values at various depths are correctly bound and updated when dot syntax was used', function(){
  // https://github.com/marcusphillips/react/issues/2
  var object = {
    value: null,
    one:{
      value: null,
      two:{
        value: null,
        three:{
          value: null
        }
      }
    }
  };
  var node = $('<div>\
    <div id="zero" react="contain value"></div>\
    <div id="one" react="contain one.value"></div>\
    <div id="two" react="contain one.two.value"></div>\
    <div id="three" react="contain one.two.three.value">\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});

  object.value = 0;
  react.changed(object, 'value');
  same(jQuery( '#zero', node)[0].innerHTML, '0', 'depth zero got set');

  object.one.value = 1;
  react.changed(object.one, 'value');
  same(jQuery( '#one', node)[0].innerHTML, '1', 'depth one got set');

  object.one.two.value = 2;
  react.changed(object.one.two, 'value');
  same(jQuery('#two', node)[0].innerHTML, '2', 'depth two got set');

  object.one.two.three.value = 3;
  react.changed(object.one.two.three, 'value');
  same(jQuery('#three', node)[0].innerHTML, '3', 'depth three got set');
});

test('regression test - within directive doesn\'t halt updates to the changed loop', function(){
  // https://github.com/marcusphillips/react/issues/3
  var object = {bar:{prop:'original'}};
  var node = $('<div>\
    <div react="within bar">\
      <div id="foo" react="contain prop"></div>\
    </div>\
    <div react="within bar">\
      <div id="bar" react="contain prop"></div>\
    </div>\
    <div react="within bar">\
      <div id="baz" react="contain prop">\
    </div>\
  </div>')[0];
  react.update({node: node, scope: object, anchor: true});
  object.bar.prop = 'changed';
  react.changed(object);
  same(jQuery('#foo', node)[0].innerHTML, 'changed', 'foo gets set');
  same(jQuery('#bar', node)[0].innerHTML, 'changed', 'bar gets set');
  same(jQuery('#baz', node)[0].innerHTML, 'changed', 'baz gets set');
});
