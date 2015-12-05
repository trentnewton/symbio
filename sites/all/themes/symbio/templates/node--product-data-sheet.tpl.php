<header class="major-header">
  <h2 itemprop="headline"><?php print render($content['field_pds_category']); ?></h2>
</header>
<table>
  <thead>
    <tr>
      <th><?php print t('Product Name'); ?></th>
      <th><?php print render($content['field_pds_description']['#title']); ?></th>
      <th width="200"><?php print render($content['field_pds_date_issued']['#title']); ?></th>
      <th width="50"><?php print render($content['field_pds_download']['#title']); ?></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><?php print $title; ?></td>
      <td><?php print render($content['field_pds_description']); ?></td>
      <td><?php print render($content['field_pds_date_issued']); ?></td>
      <td class="text-center">
        <a class="download" href="<?php print render($content['field_pds_download']); ?>"><svg class="icon icon-download"><use xlink:href="#icon-download"></use></svg></a>
      </td>
    </tr>
  </tbody>
</table>