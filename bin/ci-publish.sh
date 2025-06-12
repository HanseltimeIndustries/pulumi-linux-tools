#!/bin/bash -e

##################################################################################
#
# This is a bundled script for calling publishing of changesets since it turns out
# changesets and yarn monorepos don't play exactly well.  This solves that.
#
# This is also because the auto changset action can't handle very complex commands as
# arguments.
#
# This assumes that yarn changeset version has been applied already
#
# https://github.com/changesets/changesets/issues/432
#
##################################################################################

echo "Calling workspaces foreach"
yarn workspaces foreach --no-private --since npm publish --access public

echo "Updating tags"
yarn changeset tag