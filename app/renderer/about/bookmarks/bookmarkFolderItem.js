/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../components/immutableComponent')

// Actions
const aboutActions = require('../../../../js/about/aboutActions')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// Utils
const dndData = require('../../../../js/dndData')
const siteUtil = require('../../../../js/state/siteUtil')
const cx = require('../../../../js/lib/classSet')

class BookmarkFolderItem extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.state = {
      isDragOver: false
    }
  }
  onDragStart (e) {
    if (this.props.draggable !== false) {
      e.dataTransfer.effectAllowed = 'all'
      dndData.setupDataTransferURL(e.dataTransfer,
        this.props.bookmarkFolder.get('location'),
        this.props.bookmarkFolder.get('customTitle') || this.props.bookmarkFolder.get('title'))
      dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.BOOKMARK, this.props.bookmarkFolder)
    }
  }
  onDragOver (e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    this.setState({
      isDragOver: true
    })
  }
  onDragLeave (e) {
    this.setState({
      isDragOver: false
    })
  }
  /**
   * Move a folder, a bookmark, or multiple bookmarks IF move is allowed.
   * ex: won't allow child folder to become parent of an ancestor, etc.
   */
  moveBookmark (e, bookmark) {
    if (siteUtil.isMoveAllowed(this.props.allBookmarkFolders, bookmark, this.props.bookmarkFolder)) {
      const bookmarkSiteKey = siteUtil.getSiteKey(bookmark)
      const bookmarkFolderSiteKey = siteUtil.getSiteKey(this.props.bookmarkFolder)
      aboutActions.moveSite(bookmarkSiteKey,
        bookmarkFolderSiteKey,
        dndData.shouldPrependVerticalItem(e.target, e.clientY),
        true)
    }
  }
  clearSelection () {
    if (this.props.onClearSelection) {
      this.props.onClearSelection()
    }
  }
  // NOTE: both folders AND bookmarks can be dropped here
  onDrop (e) {
    this.setState({
      isDragOver: false
    })

    const bookmarkData = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (bookmarkData) {
      if (Immutable.List.isList(bookmarkData)) {
        bookmarkData.forEach((bookmark) => {
          this.moveBookmark(e, bookmark)
        })
        this.clearSelection()
        return
      }

      this.moveBookmark(e, bookmarkData)
      this.clearSelection()
    }
  }
  render () {
    const BookmarkFolderList = require('./bookmarkFolderList')
    const childBookmarkFolders = this.props.allBookmarkFolders
      .filter((bookmarkFolder) => (bookmarkFolder.get('parentFolderId') || 0) === this.props.bookmarkFolder.get('folderId'))
    return <div>
      <div role='listitem'
        onDrop={this.onDrop.bind(this)}
        onDragStart={this.onDragStart.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onDragLeave={this.onDragLeave.bind(this)}
        onContextMenu={aboutActions.contextMenu.bind(this, this.props.bookmarkFolder.toJS(), 'bookmark-folder')}
        onClick={this.props.onChangeSelectedFolder.bind(null, this.props.bookmarkFolder.get('folderId'))}
        draggable={this.props.draggable !== false ? 'true' : 'false'}
        data-folder-id={this.props.bookmarkFolder.get('folderId')}
        className={cx({
          listItem: true,
          selected: this.props.selected,
          isDragOver: this.state.isDragOver
        })}
      >
        <span className={cx({
          bookmarkFolderIcon: true,
          fa: true,
          'fa-folder-o': !this.props.selected && !this.state.isDragOver,
          'fa-folder-open-o': this.props.selected || this.state.isDragOver
        })} />
        <span data-l10n-id={this.props.dataL10nId}>
          {this.props.bookmarkFolder.get('customTitle') || this.props.bookmarkFolder.get('title')}
        </span>
      </div>
      {
        childBookmarkFolders.size > 0
          ? <BookmarkFolderList
            search={this.props.search}
            onChangeSelectedFolder={this.props.onChangeSelectedFolder}
            bookmarkFolders={childBookmarkFolders}
            selectedFolderId={this.props.selectedFolderId}
            allBookmarkFolders={this.props.allBookmarkFolders}
          />
          : null
      }
    </div>
  }
}

module.exports = BookmarkFolderItem
