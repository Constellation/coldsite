/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const Compiler = require('../compiler')
const JSX = require('./jsx');
const B = require('ast-types').builders;
const Syntax = require('estraverse').Syntax;

function toIdentifier($name) {
    return $name.names.reduce((expr, name) => {
        if (expr) {
            return B.memberExpression(expr, B.identifier(name), false);
        }
        return B.identifier(name);
    }, null);
}

class DekuCompiler extends Compiler {
    constructor() {
        super('deku');
    }

    compile($node) {
        let quasi = $node.quasi;
        let quasis = quasi.quasis;
        let text = quasis.reduce((text, element, index) => {
            text += element.value.cooked;
            if (!element.tail) {
                text += '{';
                if (quasi.expressions[index].type === Syntax.SpreadElement) {
                    text += '...';
                }
                text += index + '}';
            }
            return text;
        }, '');
        let element = JSX.parse(text);
        return this.compileElement(element, quasi);
    }

    compileName($name, $node) {
        if ($name.isComponentName) {
            return toIdentifier($name);
        }
        return B.literal($name.names[0]);
    }

    compileAttributes($attributes, $node) {
        if (!$attributes) {
            return B.literal(null);
        }

        let isSpread = false;
        let spreads = [];
        let properties = [];
        $attributes.forEach(attribute => {
            if (attribute.type === 'Attribute') {
                let valueNode = attribute.value;
                let value = null;
                if (valueNode.type === 'Text') {
                    value = B.literal(valueNode.text);
                } else {
                    value = $node.expressions[valueNode.id];
                }
                properties.push(B.property('init', toIdentifier(attribute.name), value));
            } else {
                isSpread = true;
                if (properties.length) {
                    spreads.push(B.objectExpression(properties));
                    properties = [];
                }
                spreads.push($node.expressions[attribute.id].argument);
            }
        });
        if (properties.length) {
            spreads.push(B.objectExpression(properties));
        }

        if (isSpread) {
            return B.callExpression(B.identifier('extend'), spreads);
        }
        return spreads[0];
    }

    compileChildren($children, $node) {
        if (!$children) {
            return B.literal(null);
        }
        return B.arrayExpression($children.map(child => {
            if (child.type === 'Text') {
                return B.literal(child.text);
            } else if (child.type === 'Expression') {
                return $node.expressions[child.id];
            } else {
                return this.compileElement(child, $node);
            }
        }));
    }

    compileElement($element, $node) {
        let args = [];

        // Name.
        args.push(this.compileName($element.name, $node));

        // Attributes.
        args.push(this.compileAttributes($element.attributes, $node));

        // Children.
        args.push(this.compileChildren($element.children, $node));

        return B.callExpression(B.identifier('dom'), args);
    }
}

module.exports = DekuCompiler;

/* vim: set sw=4 ts=4 et tw=80 : */
