import {
  ElementNode,
  NodeKey,
  LexicalNode,
  EditorConfig,
  setDOMUnmanaged,
} from 'lexical'
import { cn } from '../../../../../../lib/utils'
import {
  $isMessageBlockNode,
  $isStepBlockNode,
  MessageRole,
  SerializedBlockNode,
  VERTICAL_SPACE_CLASS,
} from '../utils'

export class MessageBlockNode extends ElementNode {
  __role: MessageRole

  static getType(): string {
    return 'message-block'
  }

  static clone(node: MessageBlockNode): MessageBlockNode {
    return new MessageBlockNode(node.__role, node.__key)
  }

  constructor(role: MessageRole = 'user', key?: NodeKey) {
    super(key)
    this.__role = role
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-block-type', 'message-block')
    wrapper.setAttribute('data-lexical-key', this.__key)
    wrapper.setAttribute('data-draggable-area', 'true')

    const div = document.createElement('div')
    wrapper.appendChild(div)

    const roleColors = {
      system: 'bg-purple-50 border-purple-300',
      user: 'bg-blue-50 border-blue-300',
      assistant: 'bg-green-50 border-green-300',
      developer: 'bg-orange-50 border-orange-300',
    }

    div.className = cn(
      'message-block border-2 rounded-lg',
      roleColors[this.__role],
    )

    // Add role indicator (explicitly NOT draggable/droppable)
    const roleLabel = document.createElement('div')
    roleLabel.className =
      'message-role text-xs font-semibold text-gray-600 mb-2 uppercase px-4 pt-4'
    roleLabel.textContent = `${this.__role} message`
    roleLabel.contentEditable = 'false'
    // Explicitly mark as non-draggable
    roleLabel.setAttribute('data-draggable-area', 'false')
    div.appendChild(roleLabel)
    setDOMUnmanaged(roleLabel)

    // Create content area where children will be inserted
    const contentArea = document.createElement('div')
    contentArea.setAttribute('data-content-area', 'true')
    contentArea.className = cn(
      'message-content pb-4 [&_>*]:px-4',
      VERTICAL_SPACE_CLASS,
    )
    div.appendChild(contentArea)

    return wrapper
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__role !== this.__role) {
      const roleColors = {
        system: 'bg-purple-50 border-purple-300',
        user: 'bg-blue-50 border-blue-300',
        assistant: 'bg-green-50 border-green-300',
        developer: 'bg-orange-50 border-orange-300',
      }

      dom.className = cn(
        'message-block p-4 border-2 rounded-lg',
        VERTICAL_SPACE_CLASS,
        roleColors[this.__role],
      )

      const roleLabel = dom.querySelector('.message-role')
      if (roleLabel) {
        roleLabel.textContent = `${this.__role} message`
      }
      return true
    }
    return false
  }

  getRole(): MessageRole {
    return this.getLatest().__role
  }

  setRole(role: MessageRole): this {
    const writable = this.getWritable()
    writable.__role = role
    return writable
  }

  static importJSON(serializedNode: SerializedBlockNode): MessageBlockNode {
    const { role } = serializedNode
    return new MessageBlockNode(role || 'user')
  }

  exportJSON(): SerializedBlockNode {
    return {
      ...super.exportJSON(),
      type: 'message-block',
      blockType: 'message',
      role: this.__role,
    }
  }

  canBeEmpty(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canInsertChild(child: LexicalNode): boolean {
    return !$isMessageBlockNode(child) && !$isStepBlockNode(child)
  }

  canReplaceWith(_replacement: LexicalNode): boolean {
    // Can be replaced with any other block type
    return true
  }

  canMergeWith(node: LexicalNode): boolean {
    // Can only merge with other message blocks of the same role
    return $isMessageBlockNode(node) && node.getRole() === this.getRole()
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }

  getDOMSlot(element: HTMLElement) {
    const contentArea = element.querySelector(
      '[data-content-area="true"]',
    ) as HTMLElement
    return super.getDOMSlot(element).withElement(contentArea)
  }
}
