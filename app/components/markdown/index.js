import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import ReactMarkdown from 'react-markdown';
import htmlParser from 'react-markdown/plugins/html-parser';
import JsxParser from 'react-jsx-parser';

const parseHtml = htmlParser({
  isValidNode: node => node.type !== 'script',
  processingInstructions: [
    /* ... */
  ]
});

const componentTransforms = {
  React: props => <React.Fragment>{props.children}</React.Fragment>,
  Color: ({ text, color }) => (
    <span
      style={{
        borderBottom: `2px solid ${color}`,
        fontWeight: 'bold'
      }}
    >
      {text}
    </span>
  )
};

const renderers = {
  html: props => (
    <JsxParser
      jsx={props.value}
      components={componentTransforms}
      renderInWrapper={false}
    />
  )
};

const Markdown = withStyles({
  root: {
    fontSize: 15,
    padding: 10
  }
})(({ source, classes }) => (
  <ReactMarkdown
    className={classes.root}
    source={source}
    escapeHtml={false}
    renderers={renderers}
  />
));

export default Markdown;
