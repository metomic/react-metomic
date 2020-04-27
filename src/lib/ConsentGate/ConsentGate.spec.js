import React from 'react';
import {render, fireEvent, createEvent, act} from '@testing-library/react';
import ConsentGate, {MTM_TAG_TYPE} from './ConsentGate';
import MetomicProvider from '../MetomicProvider';

const MTM_TAG_SELECTOR = `[type="${MTM_TAG_TYPE}"]`;

function loadMetomic(baseElement) {
  const embed = baseElement.querySelector('script[src*="embed"]');
  const config = baseElement.querySelector('script[src*="config.js"]');
  fireEvent(embed, createEvent.load(embed));
  global._mtm = {};
  fireEvent(config, createEvent.load(config));
}

describe('MetomicProvider', () => {
  beforeEach(() => {
    global.Metomic = jest.fn();
  });

  describe('When Metomic is not yet loaded', () => {
    it('should render nothing', () => {
      const {container} = render(
        <MetomicProvider projectId="foobar">
          <ConsentGate micropolicy="policy">
            <iframe title="test-iframe" src="some-third-party" />
          </ConsentGate>
        </MetomicProvider>
      );
      expect(container).toMatchInlineSnapshot('<div />');
    });
  });

  describe('When Metomic is loaded', () => {
    let baseElement;
    let queryByTestId;
    beforeEach(() => {
      ({baseElement, queryByTestId} = render(
        <MetomicProvider projectId="foobar">
          <ConsentGate micropolicy="policy">
            <picture data-testid="picture">
              <source
                media="(max-width: 799px)"
                srcSet="some-src-set"
                data-testid="source"
              />
              <img src="some-src" alt="some alt" data-testid="img" />
            </picture>
          </ConsentGate>
        </MetomicProvider>,
        {
          baseElement: document.documentElement,
        }
      ));
    });
    describe('if the user has consented to the policy', () => {
      beforeEach(() => {
        global.Metomic.mockImplementation((command, props, callback) => {
          if (command === 'getConsentState') {
            expect(props).toEqual({slug: 'policy'});
            act(() => callback({enabled: true}));
          }
        });
        loadMetomic(baseElement);
      });
      it('should render the children', () => {
        expect(queryByTestId('picture')).toBeTruthy();
        expect(queryByTestId('img')).toBeTruthy();
        expect(queryByTestId('source')).toBeTruthy();
      });
    });

    describe('if the user has not yet consented to the policy', () => {
      let onConsentChange;
      beforeEach(() => {
        global.Metomic.mockImplementation((command, props, callback) => {
          if (command === 'getConsentState') {
            expect(props).toEqual({slug: 'policy'});
            act(() => callback({enabled: false}));
          } else if (command === 'ConsentManager:onConsentStateChange') {
            onConsentChange = props;
          }
        });
        loadMetomic(baseElement);
      });
      it('should render the mtmTag with fromReact: true', () => {
        expect(baseElement.querySelector(MTM_TAG_SELECTOR)).toHaveProperty(
          'fromReact',
          true
        );
      });
      it('should render the children with a blocked src', () => {
        expect(queryByTestId('picture')).toBeTruthy();
        expect(queryByTestId('source')).toHaveAttribute(
          'data-blocked-srcset',
          'some-src-set'
        );
        expect(queryByTestId('img')).toHaveAttribute(
          'data-blocked-src',
          'some-src'
        );
      });

      describe('when the user then consents to another policy', () => {
        beforeEach(() => {
          act(() =>
            onConsentChange({slug: 'other-policy', state: 'CONSENTED'})
          );
        });
        it('should keep the child blocked', () => {
          expect(queryByTestId('picture')).toBeTruthy();
          expect(queryByTestId('source')).toHaveAttribute(
            'data-blocked-srcset',
            'some-src-set'
          );
          expect(queryByTestId('img')).toHaveAttribute(
            'data-blocked-src',
            'some-src'
          );
        });
      });

      describe('when the user then declines the policy', () => {
        beforeEach(() => {
          act(() => onConsentChange({slug: 'policy', state: 'DECLINED'}));
        });
        it('should keep the child blocked', () => {
          expect(queryByTestId('picture')).toBeTruthy();
          expect(queryByTestId('source')).toHaveAttribute(
            'data-blocked-srcset',
            'some-src-set'
          );
          expect(queryByTestId('img')).toHaveAttribute(
            'data-blocked-src',
            'some-src'
          );
        });
      });

      describe('when the user then consents to the policy', () => {
        beforeEach(() => {
          act(() => onConsentChange({slug: 'policy', state: 'CONSENTED'}));
        });
        it('should not render an mtmTag', () => {
          expect(baseElement.querySelector(MTM_TAG_SELECTOR)).toBeFalsy();
        });
        it('should render the children unblocked', () => {
          expect(queryByTestId('picture')).toBeTruthy();
          expect(queryByTestId('source')).toHaveAttribute(
            'srcset',
            'some-src-set'
          );
          expect(queryByTestId('img')).toHaveAttribute('src', 'some-src');
        });
      });
    });
  });
});
