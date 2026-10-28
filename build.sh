#!/bin/zsh
# shell.html → index.html(전체), g/index.html(골든타임), m/index.html(몸속극장)
cd "${0:A:h}"
sed -e 's#__BASE__#./#' shell.html > index.html
for c in g m; do
  mkdir -p $c
  sed -e 's#__BASE__#../#' -e "s#<!--PRESET-->#<script>window.LINKHUB_BASE='../';window.LINKHUB_PRESET='$c';</script>#" shell.html > $c/index.html
done
echo built
