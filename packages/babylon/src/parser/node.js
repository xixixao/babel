// @flow

import Parser from "./index";
import UtilParser from "./util";
import { SourceLocation, type Position } from "../util/location";
import type { Comment, Node as NodeType, NodeBase } from "../types";

// Start an AST node, attaching a start offset.

const commentKeys = ["leadingComments", "trailingComments", "innerComments"];

class Node implements NodeBase {
  constructor(parser: Parser, pos: number, loc: Position, indent: ?number) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    this.loc = new SourceLocation(loc);
    if (parser && parser.options.ranges) this.range = [pos, 0];
    if (parser && parser.filename) this.loc.filename = parser.filename;
    if (parser && parser.hasPlugin("lenient")) {
      this.extra = { indent };
    }
  }

  type: string;
  start: number;
  end: number;
  loc: SourceLocation;
  range: [number, number];
  leadingComments: Array<Comment>;
  trailingComments: Array<Comment>;
  innerComments: Array<Comment>;
  extra: { [key: string]: any };

  __clone(): this {
    // $FlowIgnore
    const node2: any = new Node();
    Object.keys(this).forEach(key => {
      // Do not clone comments that are already attached to the node
      if (commentKeys.indexOf(key) < 0) {
        // $FlowIgnore
        node2[key] = this[key];
      }
    });

    return node2;
  }
}

export class NodeUtils extends UtilParser {
  startNode<T: NodeType>(): T {
    const indent = this.hasPlugin("lenient") ? this.state.indent : undefined;
    // $FlowIgnore
    return new Node(this, this.state.start, this.state.startLoc, indent);
  }

  startNodeAt<T: NodeType>(pos: number, loc: Position, indent?: ?number): T {
    const ind =
      this.hasPlugin("lenient") && indent != null ? indent : this.state.indent;
    // $FlowIgnore
    return new Node(this, pos, loc, ind);
  }

  /** Start a new node with a previous node's location. */
  startNodeAtNode<T: NodeType>(type: NodeType): T {
    return this.startNodeAt(type.start, type.loc.start, type.extra.indent);
  }

  // Finish an AST node, adding `type` and `end` properties.

  finishNode<T: NodeType>(node: T, type: string): T {
    return this.finishNodeAt(
      node,
      type,
      this.state.lastTokEnd,
      this.state.lastTokEndLoc,
    );
  }

  // Finish node at given position

  finishNodeAt<T: NodeType>(
    node: T,
    type: string,
    pos: number,
    loc: Position,
  ): T {
    node.type = type;
    node.end = pos;
    node.loc.end = loc;
    if (this.options.ranges) node.range[1] = pos;
    this.processComment(node);
    return node;
  }

  /**
   * Reset the start location of node to the start location of locationNode
   */
  resetStartLocationFromNode(node: NodeBase, locationNode: NodeBase): void {
    node.start = locationNode.start;
    node.loc.start = locationNode.loc.start;
    if (this.options.ranges) node.range[0] = locationNode.range[0];
  }
}
