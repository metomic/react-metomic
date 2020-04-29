import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {noop} from '../utils';

export const MetomicContext = React.createContext({
  isReady: false,
  debug: false,
  autoblockingRules: undefined,
});

const groupRulesBySlug = (rules = []) =>
  rules.reduce(
    (rulesBySlug, rule) => ({
      ...rulesBySlug,
      [rule.policySlug]: [...(rulesBySlug[rule.policySlug] || []), rule],
    }),
    {}
  );

const MetomicProvider = ({
  projectId,
  autoblocking = true,
  debug = false,
  children,
}) => {
  const [embedReady, setEmbedReady] = useState(false);
  const [mtmContext, setMtmContext] = useState(undefined);
  const isReady = embedReady && (!autoblocking || mtmContext);

  useEffect(() => {
    const embed = document.createElement('script');
    embed.src = process.env.REACT_APP_EMBED_URL;
    embed.crossorigin = true;
    embed.defer = true;
    embed.charset = 'utf-8';
    embed.addEventListener('load', () => setEmbedReady(true));
    document.head.appendChild(embed);

    return () => embed.remove();
  }, []);

  useEffect(() => {
    if (!autoblocking) return noop;
    const config = document.createElement('script');
    config.src = `${process.env.REACT_APP_CONFIG_ENDPOINT}?id=${projectId}`;
    config.crossorigin = true;
    config.defer = true;
    config.charset = 'utf-8';
    config.addEventListener('load', () => setMtmContext(window._mtm));
    document.head.appendChild(config);

    return () => config.remove();
  }, [autoblocking, projectId]);

  useEffect(() => {
    if (isReady) {
      window.Metomic('load', {projectId});
    }
  }, [autoblocking, isReady, projectId]);

  return (
    <>
      <MetomicContext.Provider
        value={{
          isReady,
          // eslint-disable-next-line no-console
          debug: (...a) => console.log(`[metomic]`, ...a),
          autoblockingRules: groupRulesBySlug(
            mtmContext?.configAutoblocking?.rules
          ),
        }}>
        {children}
      </MetomicContext.Provider>
    </>
  );
};

MetomicProvider.propTypes = {
  projectId: PropTypes.string.isRequired,
  autoblocking: PropTypes.bool,
  debug: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

MetomicProvider.defaultProps = {
  autoblocking: true,
  debug: false,
};

export default MetomicProvider;
