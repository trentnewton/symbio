<?php global $user;
  // Check to see if $user has the administrator role.
  if (in_array('administrator', array_values($user->roles))) { ?>
    <div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>
    <?php print render($title_suffix); ?>
<?php } ?>
<header class="major-header">
  <h5 class="subheader"><?php print t('Category:'); ?></h5>
  <h4><?php print render($content['field_sds_category']); ?></h4>
</header>
<table>
  <thead>
    <tr>
      <th><?php print t('Product Name'); ?></th>
      <th><?php print render($content['field_sds_description']['#title']); ?></th>
      <th width="200"><?php print render($content['field_sds_date_issued']['#title']); ?></th>
      <th width="50"><?php print render($content['field_sds_download']['#title']); ?></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><?php print $title; ?></td>
      <td><?php print render($content['field_sds_description']); ?></td>
      <td><?php print render($content['field_sds_date_issued']); ?></td>
      <td class="text-center">
        <a class="download" href="<?php print render($content['field_sds_download']); ?>"><svg class="icon icon-download"><use xlink:href="#icon-download"></use></svg></a>
      </td>
    </tr>
  </tbody>
</table>
<?php global $user;
  // Check to see if $user has the administrator role.
  if (in_array('administrator', array_values($user->roles))) { ?>
    </div>
<?php } ?>