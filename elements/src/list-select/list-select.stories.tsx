import * as React from 'react';

import { ListSelect } from '../index';
customElements.define('list-select', ListSelect);

export default {
  title: 'Components/list-select',
};

const Template = (args?: any) => {
  function srcFunc(search: string) {
    return fetch('https://dummyjson.com/products/search?q='+search)
      .then(res => res.json())
      .then(res => res.products || [])
  }

  return <>
    <list-select selected="file-a">
      <ul>
        <li> File
          <ul>
            <li id="new">New</li>
            <li>Open
              <ul>
                <li> Recent Files 
                  <ul>
                    <li id="file-a">File A</li>
                    <li>File B</li>
                    <li>File C</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li> Edit
          <ul>
            <li>Undo</li>
            <li id="redo">Redo</li>
            <li data-disabled="disabled">Cut</li>
            <li data-disabled="disabled">Copy</li>
            <li data-disabled="disabled">Paste</li>
          </ul>
        </li>
        <li> Format
          <ul>
            <li>Font</li>
            <li>Text</li>
          </ul>
        </li>
        <li> View
          <ul>
            <li>100%</li>
            <li>Zoom In</li>
            <li>Zoom Out</li>
          </ul>
        </li>
        <li id="help">Help</li>
      </ul>
    </list-select>
    </>
};

export const Primary = Template.bind({});