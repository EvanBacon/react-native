/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import 'react-native/Libraries/Core/InitializeCore';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import invariant from 'invariant';
import * as React from 'react';
import {NativeText} from 'react-native/Libraries/Text/TextNativeComponent';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';
import ReadOnlyText from 'react-native/src/private/webapis/dom/nodes/ReadOnlyText';

function ensureReadOnlyText(value: mixed): ReadOnlyText {
  return ensureInstance(value, ReadOnlyText);
}

function ensureReadOnlyNode(value: mixed): ReadOnlyNode {
  return ensureInstance(value, ReadOnlyNode);
}

function ensureReactNativeElement(value: mixed): ReactNativeElement {
  return ensureInstance(value, ReactNativeElement);
}

describe('ReadOnlyText', () => {
  it('should be used to create public text instances when the `enableAccessToHostTreeInFabric` feature flag is enabled', () => {
    const parentNodeRef = React.createRef<HostInstance>();

    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
    });

    const parentNode = ensureReadOnlyNode(parentNodeRef.current);
    const textNode = parentNode.childNodes[0];

    expect(textNode).toBeInstanceOf(ReadOnlyText);
  });

  describe('extends `ReadOnlyNode`', () => {
    describe('nodeName', () => {
      it('returns "#text"', () => {
        const parentNodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeName).toBe('#text');
      });
    });

    describe('nodeType', () => {
      it('returns ReadOnlyNode.TEXT_NODE', () => {
        const parentNodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeType).toBe(ReadOnlyNode.TEXT_NODE);
      });
    });

    describe('nodeValue / textContent', () => {
      it('returns the string data contained in the node', () => {
        const parentNodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode = ensureReadOnlyNode(parentNodeRef.current);
        const textNode = parentNode.childNodes[0];

        expect(textNode.nodeValue).toBe('Some text');
        expect(textNode.textContent).toBe('Some text');
      });
    });

    describe('traversal', () => {
      it('only preserves text nodes when their contents do not change', () => {
        const parentElementRef = React.createRef<HostInstance>();
        const childElementARef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B
            </NativeText>,
          );
        });

        const parentElement: ReactNativeElement = ensureReactNativeElement(
          parentElementRef.current,
        );
        const childElementA: ReactNativeElement = ensureReactNativeElement(
          childElementARef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextA.textContent).toBe('Text A');
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        expect(childTextB.textContent).toBe('Text B');

        // Validate structure
        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);

        // Change contents of the second text only
        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B modified
            </NativeText>,
          );
        });

        expect(parentElement.childNodes.length).toBe(3);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).not.toBe(childTextB);
        expect(parentElement.childNodes[2]).toBeInstanceOf(ReadOnlyText);
        expect(ensureReadOnlyText(parentElement.childNodes[2]).data).toBe(
          'Text B modified',
        );
        expect(childTextB.isConnected).toBe(false);
      });
    });
  });

  describe('extends `ReadOnlyCharacterData`', () => {
    describe('data / length', () => {
      it('returns the string data and its length, respectively', () => {
        const parentNodeRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<NativeText ref={parentNodeRef}>Some text</NativeText>);
        });

        const parentNode: ReadOnlyNode = ensureReadOnlyNode(
          parentNodeRef.current,
        );
        const textNode = ensureReadOnlyText(parentNode.childNodes[0]);

        expect(textNode.data).toBe('Some text');
        expect(textNode.length).toBe('Some text'.length);
      });
    });

    describe('previousElementSibling / nextElementSibling', () => {
      it('return updated relative elements', () => {
        const parentElementRef = React.createRef<HostInstance>();
        const childElementARef = React.createRef<HostInstance>();
        const childElementBRef = React.createRef<HostInstance>();
        const childElementCRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
              <NativeText key="childA" ref={childElementARef} />
              Text B
              <NativeText key="childB" ref={childElementBRef} />
              Text C
              <NativeText key="childC" ref={childElementCRef} />
              Text D
            </NativeText>,
          );
        });

        const parentElement = ensureReactNativeElement(
          parentElementRef.current,
        );
        const childElementA = ensureReactNativeElement(
          childElementARef.current,
        );
        const childElementB = ensureReactNativeElement(
          childElementBRef.current,
        );
        const childElementC = ensureReactNativeElement(
          childElementCRef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextB = parentElement.childNodes[2];
        invariant(
          childTextB instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextC = parentElement.childNodes[4];
        invariant(
          childTextC instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );
        const childTextD = parentElement.childNodes[6];
        invariant(
          childTextD instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        // Validate structure
        expect(parentElement.childNodes.length).toBe(7);
        expect(parentElement.childNodes[0]).toBe(childTextA);
        expect(parentElement.childNodes[1]).toBe(childElementA);
        expect(parentElement.childNodes[2]).toBe(childTextB);
        expect(parentElement.childNodes[3]).toBe(childElementB);
        expect(parentElement.childNodes[4]).toBe(childTextC);
        expect(parentElement.childNodes[5]).toBe(childElementC);
        expect(parentElement.childNodes[6]).toBe(childTextD);

        expect(childTextA.previousElementSibling).toBe(null);
        expect(childTextA.nextElementSibling).toBe(childElementA);

        expect(childTextB.previousElementSibling).toBe(childElementA);
        expect(childTextB.nextElementSibling).toBe(childElementB);

        expect(childTextC.previousElementSibling).toBe(childElementB);
        expect(childTextC.nextElementSibling).toBe(childElementC);

        expect(childTextD.previousElementSibling).toBe(childElementC);
        expect(childTextD.nextElementSibling).toBe(null);
      });
    });

    describe('substringData', () => {
      it('returns a slice of the text content', () => {
        const parentElementRef = React.createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <NativeText key="parent" ref={parentElementRef}>
              Text A
            </NativeText>,
          );
        });

        const parentElement = ensureReactNativeElement(
          parentElementRef.current,
        );

        // Get text nodes and refine them as text nodes for Flow
        const childTextA = parentElement.childNodes[0];
        invariant(
          childTextA instanceof ReadOnlyText,
          'expected instance of ReadOnlyText',
        );

        expect(childTextA.substringData(0, 1)).toBe('T');
        expect(childTextA.substringData(0, 5)).toBe('Text ');
        // Count > length
        expect(childTextA.substringData(0, 10)).toBe('Text A');
        // Count = length
        expect(childTextA.substringData(0, 6)).toBe('Text A');
        expect(childTextA.substringData(0, 0)).toBe('');
        // Negative count
        expect(childTextA.substringData(0, -1)).toBe('Text A');
        expect(childTextA.substringData(0, -10)).toBe('Text A');

        expect(childTextA.substringData(1, 3)).toBe('ext');
        expect(childTextA.substringData(5, 1)).toBe('A');
        // Offset + count > length
        expect(childTextA.substringData(5, 2)).toBe('A');
        // Offset = length
        expect(childTextA.substringData(6, 1)).toBe('');
        // Offset = length & negative count
        expect(childTextA.substringData(6, -1)).toBe('');
        // Negative count
        expect(childTextA.substringData(5, -1)).toBe('A');

        // Out of bounds offset
        expect(() => {
          childTextA.substringData(-1, 0);
        }).toThrow();
        expect(() => {
          childTextA.substringData(7, 0);
        }).toThrow();
      });
    });
  });
});
