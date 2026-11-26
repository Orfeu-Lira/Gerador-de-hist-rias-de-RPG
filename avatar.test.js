'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{validarAvatar}=require('./avatar');
const foto='UklGRkwAAABXRUJQVlA4IEAAAABwAwCdASogACAAPm00lkekIyIhKAgAgA2JZQDKLoB+AABBlBAA/vCbQ//ILlhdcjX/8gP+QH/ID/+PfYwoMAAA';
test('aceita WebP válido',()=>{assert.ok(validarAvatar(foto));});
test('rejeita base64, formato e RIFF adulterados',()=>{assert.equal(validarAvatar('not an image'),null);assert.equal(validarAvatar(Buffer.from('GIF89a'.repeat(15)).toString('base64')),null);const b=Buffer.from(foto,'base64');b.writeUInt32LE(1,4);assert.equal(validarAvatar(b.toString('base64')),null);});
