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

const Map = require('es6-map');
const estraverse = require('estraverse');
const Syntax = estraverse.Syntax;

class Injector extends estraverse.Controller {
    constructor() {
        super();
        this.compilers = new Map();
    }

    add(name, compiler) {
        this.compilers.add(name, compiler);
    }

    inject(tree) {
        this.tree = tree;
        return this.replace(tree, {
            enter(node) {
                if (node.type !== Syntax.TaggedTemplateExpression) {
                    return;
                }

                let caller = node.tag;
                if (caller.type !== Syntax.Identifier) {
                    return;
                }

                let compiler = this.compilers.get(caller.name);

                if (!compiler) {
                    return;
                }

                return compiler.compile(node, this);
            }
        });
    }
}

module.exports = Injector;

/* vim: set sw=4 ts=4 et tw=80 : */
