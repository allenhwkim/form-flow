export default /* css */ `
:host {
  display: inline-block;
  background: #F5F5F5;
  padding: 16px;
  border: 1px solid #F5F5F5;
  box-sizing: border-box;
}

.x-file-input {
  cursor: pointer;
  & input {
    display: none;
  }
}

.x-file-list {
  color: #666;
  .x-file { /* file info */
    display: flex;
    padding: 4px;
    position: relative;
    justify-content: space-between;

    &:first-child {
      border-top: 1px solid #ccc;
    }
    &:not(:last-child) {
      border-bottom: 1px solid #ccc;
    }

    .x-name {
      white-space: nowrap;
    }

    .x-preview {
      max-width: 200px;
      max-height: 40px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .x-buttons * {
      border: 0;
      background: transparent;
      cursor: pointer;
    }
  }
}`;